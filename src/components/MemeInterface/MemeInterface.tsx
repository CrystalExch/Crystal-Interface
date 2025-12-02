import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';
import { NadFunAbi } from '../../abis/NadFun.ts';

import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';
import {
  setGlobalPopupHandlers,
  useWalletPopup,
} from '../MemeTransactionPopup/useWalletPopup';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import MemeChart from './MemeChart/MemeChart';
import MemeOrderCenter from './MemeOrderCenter/MemeOrderCenter';
import MemeTradesComponent from './MemeTradesComponent/MemeTradesComponent';
import QuickBuyWidget from './QuickBuyWidget/QuickBuyWidget';
import { CrystalLaunchpadToken } from '../../abis/CrystalLaunchpadToken';

import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { useSharedContext } from '../../contexts/SharedContext';
import { settings } from '../../settings';
import closebutton from '../../assets/close_button.png';
import contract from '../../assets/contract.svg';
import editicon from '../../assets/edit.svg';
import merge from '../../assets/merge.png';
import gas from '../../assets/gas.svg';
import monadicon from '../../assets/monadlogo.svg';
import slippage from '../../assets/slippage.svg';
import trash from '../../assets/trash.svg';
import walleticon from '../../assets/wallet_icon.svg';
import { updateBuyPreset, updateSellPreset } from '../../utils/presetManager';
import { zeroXAbi } from '../../abis/zeroXAbi.ts';
import { zeroXActionsAbi } from '../../abis/zeroXActionsAbi.ts';
import { TokenAbi } from '../../abis/TokenAbi.ts';
import { CrystalDataHelperAbi } from '../../abis/CrystalDataHelperAbi.ts';

import './MemeInterface.css';

interface Trade {
  id: string;
  timestamp: number;
  isBuy: boolean;
  price: number;
  tokenAmount: number;
  nativeAmount: number;
  caller: string;
  isDev?: boolean;
  isYou?: boolean;
  isTracked?: boolean;
}

interface Holder {
  address: string;
  balance: number;
  tokenNet: number;
  valueNet: number;
  amountBought: number;
  amountSold: number;
  valueBought: number;
  valueSold: number;
}

interface MemeInterfaceProps {
  sliderMode: string;
  sliderPresets: number[];
  sliderIncrement: number;
  tokenList: any[];
  marketsData: any[];
  onMarketSelect: (market: any) => void;
  setSendTokenIn: (token: any) => void;
  setpopup: (value: number) => void;
  sendUserOperationAsync: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  tokendict?: { [key: string]: any };
  wethticker?: string;
  ethticker?: string;
  address: any;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  refetch?: () => void;
  isBlurred?: boolean;
  terminalRefetch: any;
  setTokenData: any;
  monUsdPrice: number;
  buyPresets: { [key: number]: { slippage: string; priority: string; amount: string } };
  sellPresets: { [key: number]: { slippage: string; priority: string } };
  monPresets?: number[];
  setMonPresets: (presets: number[]) => void;
  onTokenDataChange?: (tokenData: {
    address: string;
    symbol: string;
    name: string;
    price: number;
  }) => void;
  nonces: any;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  holders: Holder[];
  topTraders: Holder[];
  positions: any[];
  devTokens: any[];
  top10HoldingPercentage: number;
  userStats: {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
  };
  realtimeCallbackRef: any;
  selectedInterval: any;
  setSelectedInterval: any;
  chartData: any;
  page: any;
  similarTokens: any;
  token: any;
  selectedWallets: Set<string>;
  setSelectedWallets: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedIntervalRef: any;
  isTerminalDataFetching: any;
  trackedAddresses: string[];
  setTrackedAddresses: React.Dispatch<React.SetStateAction<string[]>>;
  isLoadingTrades: any;
  setIsLoadingTrades: any;
  trackedWalletsRef: any;
  isPaused?: boolean;
  backlogCount?: number;
  createSubWallet: any;
  setOneCTDepositAddress: any;
  scaAddress: any;
  signTypedDataAsync: any;
  transactionSounds: boolean;
  buySound: string;
  sellSound: string;
  volume: number;
}

const STATS_HTTP_BASE = 'https://api.crystal.exchange';
const PAGE_SIZE = 100;

const formatNumberWithCommas = (v: number, d = 6) => {
  if (v === 0) return '0.00';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: d });
  return v.toFixed(Math.min(d, 8));
};

const formatTradeAmount = (value: number): string => {
  if (value === 0) return '0';
  if (value > 0 && value < 0.01) {
    return value.toFixed(6);
  }
  return value.toFixed(2);
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

const MemeInterface: React.FC<MemeInterfaceProps> = ({
  sliderMode,
  sliderIncrement,
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sendUserOperationAsync,
  account,
  setChain,
  tokendict = {},
  wethticker,
  ethticker,
  address,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  refetch,
  isBlurred = false,
  terminalRefetch,
  monUsdPrice,
  buyPresets,
  sellPresets,
  monPresets = [100, 500, 1000, 10000],
  setMonPresets,
  onTokenDataChange,
  nonces,
  marketsData,
  trades,
  setTrades,
  holders,
  topTraders,
  positions,
  devTokens,
  top10HoldingPercentage,
  userStats,
  realtimeCallbackRef,
  selectedInterval,
  setSelectedInterval,
  chartData,
  page,
  similarTokens,
  token,
  selectedWallets,
  setSelectedWallets,
  selectedIntervalRef,
  isTerminalDataFetching,
  trackedAddresses,
  setTrackedAddresses,
  isLoadingTrades,
  setIsLoadingTrades,
  trackedWalletsRef,
  isPaused,
  backlogCount,
  createSubWallet,
  setOneCTDepositAddress,
  scaAddress,
  signTypedDataAsync,
  transactionSounds,
  buySound,
  sellSound,
  volume,
}) => {
  const playTradeSound = useCallback((isBuy: boolean) => {
    if (!transactionSounds) return;

    try {
      const soundToPlay = isBuy ? buySound : sellSound;
      const audio = new Audio(soundToPlay);
      audio.volume = volume / 100;
      audio.play().catch(err => {
        console.log('Failed to play trade sound:', err);
      });
    } catch (err) {
      console.log('Error playing trade sound:', err);
    }
  }, [transactionSounds, buySound, sellSound, volume]);
  const getSliderPosition = (
    activeView: 'chart' | 'trades' | 'ordercenter',
  ) => {
    switch (activeView) {
      case 'chart':
        return 0;
      case 'trades':
        return 1;
      case 'ordercenter':
        return 2;
      default:
        return 0;
    }
  };

  const isWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    if (balances[settings.chainConfig[activechain]?.eth]) {
      return (
        Number(balances[settings.chainConfig[activechain]?.eth]) / 10 ** Number(18)
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
    const walletsWithToken = subWallets.filter(
      (w) => getWalletTokenBalance(w.address) > 0,
    );

    if (walletsWithToken.length > 0) {
      setSelectedWallets(new Set(walletsWithToken.map((w) => w.address)));
    } else {
      setSelectedWallets(new Set(subWallets.map((w) => w.address)));
    }
  }, [subWallets, setSelectedWallets]);

  const unselectAllWallets = useCallback(() => {
    setSelectedWallets(new Set());
  }, [setSelectedWallets]);

  const selectAllWithBalance = useCallback(() => {
    const walletsWithBalance = subWallets.filter(
      (wallet) => getWalletBalance(wallet.address) > 0,
    );
    setSelectedWallets(new Set(walletsWithBalance.map((w) => w.address)));
  }, [subWallets, setSelectedWallets]);

  const selectAllWithBalanceWithoutToken = useCallback(() => {
    const walletsWithoutToken = subWallets.filter(
      (w) => getWalletTokenBalance(w.address) === 0,
    );
    const walletsWithBalance = walletsWithoutToken.filter(
      (wallet) => getWalletBalance(wallet.address) > 0,
    );
    setSelectedWallets(new Set(walletsWithBalance.map((w) => w.address)));
  }, [subWallets, setSelectedWallets]);

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

  const handleSplitTokens = async () => {
    if (selectedWallets.size === 0 || !token.id) return;

    const selected = Array.from(selectedWallets);

    const sourceAddr = selected.find(
      (addr) => (walletTokenBalances[addr]?.[token.id!] ?? 0n) > 0n,
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
      const BP = 10_000;
      const VAR = 2_000;
      const weights: number[] = selected.map(() => {
        const delta = Math.floor(Math.random() * (2 * VAR + 1)) - VAR;
        return Math.max(1, BP + delta);
      });
      const sumW = weights.reduce((a, b) => a + b, 0);
      const sumWBig = BigInt(sumW);

      const desired: Record<string, bigint> = {};
      let allocated = 0n;
      for (let i = 0; i < selected.length; i++) {
        if (i === selected.length - 1) {
          desired[selected[i]] = sourceBalance - allocated;
        } else {
          const amt = (sourceBalance * BigInt(weights[i])) / sumWBig;
          desired[selected[i]] = amt;
          allocated += amt;
        }
      }

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

  const walletPopup = useWalletPopup();
  const navigate = useNavigate();

  useEffect(() => {
    setGlobalPopupHandlers(showLoadingPopup, updatePopup);
  }, []);

  const [selectedStatsTimeframe, setSelectedStatsTimeframe] = useState('24h');
  const [hoveredStatsContainer, setHoveredStatsContainer] = useState(false);
  const [tokenInfoExpanded, setTokenInfoExpanded] = useState(true);
  const [similarTokensExpanded, setSimilarTokensExpanded] = useState(true);
  const [tokenImageErrors, setTokenImageErrors] = useState<Record<string, boolean>>({});
  const [selectedMonPreset, setSelectedMonPreset] = useState<number | null>(
    null,
  );
  const [hoveredSimilarTokenImage, setHoveredSimilarTokenImage] = useState<
    string | null
  >(null);
  const [similarTokenPreviewPosition, setSimilarTokenPreviewPosition] =
    useState({ top: 0, left: 0 });
  const [showSimilarTokenPreview, setShowSimilarTokenPreview] = useState(false);
  const similarTokenImageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isPresetEditMode, setIsPresetEditMode] = useState(false);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(
    null,
  );
  const [tempPresetValue, setTempPresetValue] = useState('');
  const [statsRaw, setStatsRaw] = useState<Record<string, any> | null>(null);
  const presetInputRef = useRef<HTMLInputElement>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_widget_open');
      return saved ? JSON.parse(saved) : true;
    } catch (error) {
      return true;
    }
  });
  const [isTradesTabVisible, setIsTradesTabVisible] = useState(() => {
    try {
      const cached = localStorage.getItem('crystal_trades_panel_visible');
      return cached ? JSON.parse(cached) : false;
    } catch {
      return false;
    }
  });
  const [isOCTradesHovered, setIsOCTradesHovered] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [sellInputMode, setSellInputMode] = useState<'percentage' | 'token'>('percentage');
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [orderCenterHeight, setOrderCenterHeight] = useState<number>(() => {
    const savedHeight = localStorage.getItem('orderCenterHeight');
    if (savedHeight !== null) {
      const parsedHeight = parseFloat(savedHeight);
      if (!isNaN(parsedHeight)) {
        return parsedHeight;
      }
    }

    if (window.innerHeight > 1080) return 367.58;
    if (window.innerHeight > 960) return 324.38;
    if (window.innerHeight > 840) return 282.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [isVertDragging, setIsVertDragging] = useState(false);
  const initialHeightRef = useRef(0);
  const initialMousePosRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDelta = e.clientY - initialMousePosRef.current;
      const newHeight = Math.max(
        150,
        Math.min(
          window.innerHeight - 400,
          initialHeightRef.current - mouseDelta
        )
      );

      setOrderCenterHeight(newHeight);
      localStorage.setItem('orderCenterHeight', newHeight.toString());
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();
      setIsVertDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const overlay = document.getElementById('global-vert-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };

    if (isVertDragging) {
      const overlay = document.createElement('div');
      overlay.id = 'global-vert-drag-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'row-resize';
      document.body.appendChild(overlay);

      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });

      const overlay = document.getElementById('global-vert-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, [isVertDragging]);

  const [isSigning, setIsSigning] = useState(false);
  const [activeTradeType, setActiveTradeType] = useState<'buy' | 'sell'>('buy');
  const [activeOrderType, _setActiveOrderType] = useState<'market' | 'Limit'>(
    'market',
  );
  const [selectedBuyPreset, setSelectedBuyPreset] = useState(1);
  const [buySlippageValue, setBuySlippageValue] = useState(() => {
    const presets = buyPresets;
    return presets[1]?.slippage;
  });

  const [buyPriorityFee, setBuyPriorityFee] = useState(() => {
    const presets = buyPresets;
    return presets[1]?.priority;
  });

  const [sellSlippageValue, setSellSlippageValue] = useState(() => {
    const presets = sellPresets;
    return presets[1]?.slippage;
  });

  const [sellPriorityFee, setSellPriorityFee] = useState(() => {
    const presets = sellPresets;
    return presets[1]?.priority;
  });
  const [settingsMode, setSettingsMode] = useState<'buy' | 'sell'>('buy');
  const [selectedSellPreset, setSelectedSellPreset] = useState(1);
  const [notif, setNotif] = useState<{
    title: string;
    subtitle?: string;
    variant?: 'success' | 'error' | 'info';
    visible?: boolean;
  } | null>(null);
  const [advancedTradingEnabled, setAdvancedTradingEnabled] = useState(false);
  const [showAdvancedDropdown, setShowAdvancedDropdown] = useState(false);
  const [advancedOrders, setAdvancedOrders] = useState<
    Array<{
      id: string;
      type: 'takeProfit' | 'stopLoss' | 'devSell' | 'migration';
      percentage?: string;
      amount?: string;
    }>
  >([]);
  const [mobileActiveView, setMobileActiveView] = useState<
    'chart' | 'trades' | 'ordercenter'
  >('chart');
  const [mobileBuyAmounts, _setMobileBuyAmounts] = useState([
    '1',
    '5',
    '10',
    '50',
  ]);
  const [mobileSellPercents, _setMobileSellPercents] = useState([
    '10%',
    '25%',
    '50%',
    '100%',
  ]);
  const [mobileSelectedBuyAmount, setMobileSelectedBuyAmount] = useState('1');
  const [mobileSelectedSellPercent, setMobileSelectedSellPercent] =
    useState('25%');
  const [mobileQuickBuyPreset, setMobileQuickBuyPreset] = useState(1);
  const [mobileTradeType, setMobileTradeType] = useState<'buy' | 'sell'>('buy');
  const [mobileWalletNames, setMobileWalletNames] = useState<{
    [address: string]: string;
  }>({});
  const [showUSD, setShowUSD] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>({});
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const walletDropdownPanelRef = useRef<HTMLDivElement>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const { activechain } = useSharedContext();

  const routerAddress = settings.chainConfig[activechain]?.router;
  const explorer = settings.chainConfig[activechain]?.explorer;
  const userAddr = address ?? account?.address ?? '';
  const [dragStart, setDragStart] = useState<{ y: number; height: number } | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);

  const trackedWalletsMap = useMemo(() => {
    const map = new Map<string, any>();
    trackedWalletsRef.current.forEach((wallet: any) => {
      map.set(wallet.address.toLowerCase(), wallet);
    });
    return map;
  }, [trackedWalletsRef.current]);

  const userAddressesSet = useMemo(() => {
    const addresses = new Set<string>();
    if (scaAddress) {
      addresses.add(scaAddress.toLowerCase());
    }
    subWallets.forEach(w => {
      addresses.add(w.address.toLowerCase());
    });
    return addresses;
  }, [scaAddress, subWallets]);

  const openInExplorer = (addr: string) =>
    window.open(`${explorer}/token/${addr}`, '_blank');

  const currentPrice = token.price || 1;

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

  useEffect(() => {
    localStorage.setItem('crystal_trades_panel_visible', JSON.stringify(isTradesTabVisible));
  }, [isTradesTabVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node) &&
        walletDropdownPanelRef.current &&
        !walletDropdownPanelRef.current.contains(event.target as Node)
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

  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    if (editingPresetIndex !== null && presetInputRef.current) {
      presetInputRef.current.focus();
      presetInputRef.current.select();
    }
  }, [editingPresetIndex]);

  useEffect(() => {
    if (tradeAmount && sellInputMode === 'token') {
      const currentBalance = activeTradeType === 'sell' ? getTotalSelectedWalletsTokenBalance() * token.price : getTotalSelectedWalletsBalance();
      const currentAmount = parseFloat(tradeAmount) || 0;
      const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
      setSliderPercent(percentage);
      setTradeAmount(tradeAmount);
    }
    else if (sellInputMode === 'percentage') {
      setSliderPercent(0);
      setTradeAmount('');
    }
  }, [activeTradeType]);

  const handleBuyPresetSelect = useCallback(
    (preset: number) => {
      setSelectedBuyPreset(preset);
      setMobileQuickBuyPreset(preset);
      const presets = buyPresets;
      if (presets[preset]) {
        setBuySlippageValue(presets[preset].slippage);
        setBuyPriorityFee(presets[preset].priority);
      }
    },
    [],
  );

  const handleSellPresetSelect = useCallback(
    (preset: number) => {
      setSelectedSellPreset(preset);
      const presets = sellPresets;
      if (presets[preset]) {
        setSellSlippageValue(presets[preset].slippage);
        setSellPriorityFee(presets[preset].priority);
      }
    },
    [],
  );

  const handleAdvancedOrderAdd = (
    orderType: 'takeProfit' | 'stopLoss' | 'devSell' | 'migration',
  ) => {
    if (advancedOrders.length >= 5) return;

    const newOrder = {
      id: `${orderType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: orderType,
      ...(orderType === 'migration'
        ? {}
        : orderType === 'devSell'
          ? { percentage: '0' }
          : {
            percentage: orderType === 'takeProfit' ? '+0' : '-0',
            amount: '0',
          }),
    };

    setAdvancedOrders((prev) => [...prev, newOrder]);
    setShowAdvancedDropdown(false);
  };

  const handleAdvancedOrderRemove = (orderId: string) => {
    setAdvancedOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const handleToggleCurrency = () => {
    setShowUSD(!showUSD);
  };

  const updateSimilarTokenPreviewPosition = useCallback((tokenId: string) => {
    const imageContainer = similarTokenImageRefs.current.get(tokenId);
    if (!imageContainer) return;

    const rect = imageContainer.getBoundingClientRect();
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

    setSimilarTokenPreviewPosition({ top, left });
  }, []);

  const positionPopup = useCallback((percent: number) => {
    const input = sliderRef.current;
    const popup = popupRef.current;
    if (!input || !popup) return;

    const container = input.parentElement as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const inputLeft = inputRect.left - containerRect.left;

    const thumbW = 10;
    const x =
      inputLeft + (percent / 100) * (inputRect.width - thumbW) + thumbW / 2;

    popup.style.left = `${x}px`;
    popup.style.transform = 'translateX(-50%)';
  }, []);

  const handleAdvancedOrderUpdate = (
    orderId: string,
    field: string,
    value: string,
  ) => {
    setAdvancedOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, [field]: value } : order,
      ),
    );
  };

  const handlePresetSelect = (preset: number) => {
    if (settingsMode === 'buy') {
      handleBuyPresetSelect(preset);
    } else {
      handleSellPresetSelect(preset);
    }
  };

  const copyToClipboard = async (text: string, label = 'Address copied') => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: label,
          subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
        });
        setTimeout(() => {
          updatePopup(txId, {
            title: label,
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: label,
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: label,
              subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
              variant: 'success',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      } catch (fallbackErr) {
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
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleSellPosition = async (position: any, monAmount: string) => {
    if (!account?.connected || !sendUserOperationAsync || !routerAddress) {
      walletPopup.showConnectionError();
      return;
    }

    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      walletPopup.showChainSwitchRequired(
        settings.chainConfig[activechain]?.name || 'Monad',
      );
      setChain?.();
      return;
    }

    const txId = `position-sell-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    showLoadingPopup?.(txId, {
      title: 'Selling position...',
      subtitle: `Selling ${monAmount} MON of ${position.symbol} across all wallets`,
      amount: monAmount,
      amountUnit: 'MON',
      tokenImage: position.imageUrl,
    });

    try {
      const monAmountNum = parseFloat(monAmount);
      const tokenPrice = position.lastPrice || currentPrice;

      if (tokenPrice <= 0) {
        throw new Error('Invalid token price');
      }

      const allWalletAddresses = [
        userAddr,
        ...subWallets.map((w) => w.address),
      ].filter(Boolean);

      const walletsWithToken = allWalletAddresses.filter((addr) => {
        const balance = walletTokenBalances?.[addr]?.[position.tokenId];
        return balance && balance > 0n;
      });

      if (walletsWithToken.length === 0) {
        throw new Error('No tokens to sell');
      }

      const decimals = tokendict?.[position.tokenId]?.decimals || 18;
      const totalTokenBalance = walletsWithToken.reduce((sum, addr) => {
        const balance = walletTokenBalances?.[addr]?.[position.tokenId];
        if (!balance || balance <= 0n) return sum;
        return sum + Number(balance) / 10 ** Number(decimals);
      }, 0);

      const tokensToSell = monAmountNum / tokenPrice;

      if (tokensToSell > totalTokenBalance) {
        throw new Error('Insufficient token balance across all wallets');
      }

      walletPopup.updateTransactionConfirming(
        txId,
        tokensToSell.toFixed(4),
        position.symbol,
        position.symbol,
      );

      const transferPromises = [];
      let remainingToSell = tokensToSell;

      for (const addr of walletsWithToken) {
        if (remainingToSell <= 0) break;

        const walletBalance = walletTokenBalances?.[addr]?.[position.tokenId];
        if (!walletBalance || walletBalance <= 0n) continue;

        const walletTokens = Number(walletBalance) / 10 ** Number(decimals);

        const walletShare = Math.min(
          (walletTokens / totalTokenBalance) * tokensToSell,
          remainingToSell,
          walletTokens
        );

        if (walletShare <= 0) continue;

        const amountTokenWei = BigInt(
          Math.round(walletShare * 10 ** Number(decimals)),
        );

        if (amountTokenWei <= 0n) continue;

        const wally = subWallets.find((w) => w.address === addr);
        const pk = wally?.privateKey ?? activeWalletPrivateKey;
        if (!pk) continue;

        const sellUo = {
          target: routerAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'sell',
            args: [true, position.tokenId as `0x${string}`, amountTokenWei, 0n],
          }),
          value: 0n,
        };

        const wallet = nonces.current.get(addr);
        const params = [{ uo: sellUo }, 0n, 0n, false, pk, wallet?.nonce, false, false, 1, addr];
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
        remainingToSell -= walletShare;
      }

      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(
        (result) => result.status === 'fulfilled' && result.value === true,
      ).length;

      walletPopup.updateTransactionSuccess(txId, {
        tokenAmount: tokensToSell,
        receivedAmount: monAmountNum,
        tokenSymbol: position.symbol,
        currencyUnit: 'MON',
      });

      terminalRefetch();
    } catch (e: any) {
      console.error(e);
      if (txId) {
        walletPopup.updateTransactionError(
          txId,
          e?.message || walletPopup.texts.TRANSACTION_REJECTED,
        );
      }
    }
  };

  const handleMobileTrade = async (
    amount: string,
    tradeType: 'buy' | 'sell',
  ) => {
    if (
      !account?.connected ||
      !sendUserOperationAsync ||
      !token.id ||
      !routerAddress
    ) {
      walletPopup.showConnectionError();
      return;
    }

    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      walletPopup.showChainSwitchRequired(
        settings.chainConfig[activechain]?.name || 'Monad',
      );
      setChain();
      return;
    }

    if (tradeType === 'buy') {
      const requestedAmount = parseFloat(amount);
      const currentMONBalance = getTotalSelectedWalletsBalance();

      if (requestedAmount > currentMONBalance) {
        walletPopup.showInsufficientBalance(
          amount,
          currentMONBalance.toFixed(4),
          'MON',
        );
        return;
      }
      setActiveTradeType('buy');
      handleTrade(amount);
    } else {
      const pct = BigInt(parseInt(amount.replace('%', ''), 10));
      const currentBalance = walletTokenBalances?.[userAddr]?.[token.id] || 0n;

      if (currentBalance <= 0n) {
        walletPopup.showInsufficientBalance('1', '0', token.symbol);
        return;
      }

      const amountTokenWei =
        pct === 100n
          ? currentBalance > 1n
            ? currentBalance - 1n
            : 0n
          : (currentBalance * pct) / 100n;

      const decimals = tokendict?.[token.id]?.decimals || 18;
      const tokenAmount = Number(amountTokenWei) / 10 ** Number(decimals);

      setActiveTradeType('sell');
      handleTrade(tokenAmount.toString());
    }
  };

  const getTotalSelectedWalletsBalance = useCallback(() => {
    if (selectedWallets.size == 0) {
      return (Number(walletTokenBalances?.[userAddr]?.[settings.chainConfig[activechain]?.eth] ?? 0) / 10 ** Number(18))
    }
    let total = 0;
    selectedWallets.forEach((address) => {
      total += getWalletBalance(address);
    });
    return total;
  }, [selectedWallets, walletTokenBalances, tokenList, activechain]);

  const getTotalSelectedWalletsTokenBalance = useCallback(() => {
    if (!token.id) return 0;
    if (selectedWallets.size == 0) {
      return (Number(walletTokenBalances?.[userAddr]?.[token.id] ?? 0) / 10 ** Number(token?.decimals || 18))
    }
    let total = 0;
    selectedWallets.forEach((address) => {
      total += getWalletTokenBalance(address);
    });
    return total;
  }, [selectedWallets, walletTokenBalances, tokenList, activechain]);

  useEffect(() => {
    const handleBuyPresetsUpdate = (event: CustomEvent) => {
      const newPresets = event.detail;
      if (newPresets[selectedBuyPreset]) {
        setBuySlippageValue(newPresets[selectedBuyPreset].slippage);
        setBuyPriorityFee(newPresets[selectedBuyPreset].priority);
      }
    };

    const handleSellPresetsUpdate = (event: CustomEvent) => {
      const newPresets = event.detail;
      if (newPresets[selectedSellPreset]) {
        setSellSlippageValue(newPresets[selectedSellPreset].slippage);
        setSellPriorityFee(newPresets[selectedSellPreset].priority);
      }
    };

    window.addEventListener('buyPresetsUpdated', handleBuyPresetsUpdate as EventListener);
    window.addEventListener('sellPresetsUpdated', handleSellPresetsUpdate as EventListener);

    return () => {
      window.removeEventListener('buyPresetsUpdated', handleBuyPresetsUpdate as EventListener);
      window.removeEventListener('sellPresetsUpdated', handleSellPresetsUpdate as EventListener);
    };
  }, [selectedBuyPreset, selectedSellPreset]);

  useEffect(() => {
    if (selectedBuyPreset) {
      updateBuyPreset(selectedBuyPreset, {
        slippage: buySlippageValue,
        priority: buyPriorityFee,
      });
    }
  }, [buySlippageValue, buyPriorityFee, selectedBuyPreset]);

  useEffect(() => {
    if (selectedSellPreset) {
      updateSellPreset(selectedSellPreset, {
        slippage: sellSlippageValue,
        priority: sellPriorityFee,
      });
    }
  }, [sellSlippageValue, sellPriorityFee, selectedSellPreset]);

  const toggleTrackedAddress = useCallback((addr: string) => {
    const a = (addr || '').toLowerCase();
    setTrackedAddresses((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }, []);

  const setTrackedToDev = useCallback(() => {
    const d = (token.dev || '').toLowerCase();
    setIsLoadingTrades(true);
    setTrackedAddresses(d ? [d] : []);
  }, [token.dev]);

  const setTrackedToSet = useCallback(() => {
    setIsLoadingTrades(true);
    setTrackedAddresses(trackedWalletsRef.current.map((w: any) => (w.address || '').toLowerCase()));
  }, []);

  const setTrackedToYou = useCallback(() => {
    const allYouAddresses = [
      (userAddr || '').toLowerCase(),
      ...(subWallets || []).map((w) => (w.address || '').toLowerCase()),
    ].filter(Boolean);

    setIsLoadingTrades(true);
    setTrackedAddresses(allYouAddresses);
  }, [userAddr, subWallets]);

  const clearTracked = useCallback(() => {
    setIsLoadingTrades(true);
    setTrackedAddresses([]);
  }, []);

  useEffect(() => {
    if (onTokenDataChange) {
      onTokenDataChange({
        address: token.id,
        symbol: token.symbol,
        name: token.name,
        price: currentPrice,
      });
    }
  }, [token.id, token.symbol, token.name, currentPrice, onTokenDataChange]);

  useEffect(() => {
    if (!hoveredSimilarTokenImage) {
      setShowSimilarTokenPreview(false);
      return;
    }

    const recalc = () =>
      updateSimilarTokenPreviewPosition(hoveredSimilarTokenImage);

    recalc();
    const showId = setTimeout(() => setShowSimilarTokenPreview(true), 10);

    const onScroll = recalc;
    const onResize = recalc;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(showId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [hoveredSimilarTokenImage, updateSimilarTokenPreviewPosition]);

  const closeNotif = useCallback(() => {
    setNotif((prev) => (prev ? { ...prev, visible: false } : prev));
    setTimeout(() => setNotif(null), 300);
  }, []);

  // backend stats
  useEffect(() => {
    if (!token.id) return;

    let disposed = false;
    let inFlight: AbortController | null = null;

    const origin = STATS_HTTP_BASE.replace(/\/$/, '');
    const url = `${origin}/stats/${token.id.toLowerCase()}`;

    const tick = async () => {
      if (disposed) return;
      try {
        inFlight?.abort();
        inFlight = new AbortController();

        const res = await fetch(url, {
          signal: inFlight.signal,
          cache: 'no-store',
        });

        if (!res.ok) return;

        const msg = await res.json();

        const src: any = msg?.type === 'stats' ? msg : msg;

        const normalized: Record<string, any> = {};
        for (const [k, v] of Object.entries(src)) {
          normalized[k] =
            typeof v === 'number' && /volume/i.test(k) ? (v as number) / 1e18 : v;
        }

        setStatsRaw(normalized);
      } catch { }
    };

    const handle = setInterval(tick, 3000);
    tick();

    return () => {
      disposed = true;
      inFlight?.abort();
      clearInterval(handle);
    };
  }, [token.id]);

  const handlePresetEditToggle = useCallback(() => {
    setIsPresetEditMode(!isPresetEditMode);
    setEditingPresetIndex(null);
    setTempPresetValue('');
  }, [isPresetEditMode]);

  const handlePresetButtonClick = useCallback(
    (preset: number, index: number) => {
      if (isPresetEditMode) {
        setEditingPresetIndex(index);
        setTempPresetValue(preset.toString());
      } else {
        setSelectedMonPreset(preset);
        if (activeTradeType === 'sell' && sellInputMode === 'percentage') {
          const percent = parseFloat(preset.toString()) || 0;
          setSliderPercent(Math.min(100, Math.max(0, percent)));
          setTradeAmount(preset.toString());
        }
        else if (activeTradeType == 'buy') {
          const currentBalance = getTotalSelectedWalletsBalance();
          const currentAmount = parseFloat(preset.toString()) || 0;
          const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
          setSliderPercent(percentage);
          setTradeAmount(preset.toString());
        }
        else {
          const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
          const currentAmount = parseFloat(preset.toString()) || 0;
          const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
          setSliderPercent(percentage);
          setTradeAmount(preset.toString());
        }
      }
    },
    [
      isPresetEditMode,
      activeTradeType,
      currentPrice,
      getTotalSelectedWalletsBalance,
      getTotalSelectedWalletsTokenBalance,
    ],
  );

  const handlePresetInputSubmit = useCallback(() => {
    if (editingPresetIndex === null || tempPresetValue.trim() === '') return;
    if (!setMonPresets || !monPresets) return;

    const newValue = parseFloat(tempPresetValue);
    if (isNaN(newValue) || newValue <= 0) return;

    const newPresets = [...monPresets];
    newPresets[editingPresetIndex] = newValue;
    setMonPresets(newPresets);
    localStorage.setItem('crystal_mon_presets', JSON.stringify(newPresets));

    setEditingPresetIndex(null);
    setTempPresetValue('');
  }, [editingPresetIndex, tempPresetValue, monPresets]);

  const handlePresetInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handlePresetInputSubmit();
      } else if (e.key === 'Escape') {
        setEditingPresetIndex(null);
        setTempPresetValue('');
      }
    },
    [handlePresetInputSubmit],
  );

  const handleTrade = async (tradeAmount: string) => {
    if (!tradeAmount || !account.connected) return;
    if (activeOrderType === 'Limit' && !limitPrice) return;

    if (account.chainId !== activechain) {
      walletPopup.showChainSwitchRequired(
        settings.chainConfig[activechain]?.name || 'Monad',
      );
      setChain();
      return;
    }

    let txId: string;

    try {
      setIsSigning(true);

      if (activeTradeType === 'buy') {
        if (selectedWallets.size > 0) {
          const walletsArray = Array.from(selectedWallets);
          const amountPerWallet = parseFloat(tradeAmount) / walletsArray.length;
          const totalAmount = parseFloat(tradeAmount);

          const isNadFun = token.source === 'nadfun';
          const contractAddress = isNadFun
            ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
            : routerAddress;

          txId = `multibuy-${Date.now()}`;
          showLoadingPopup?.(txId, {
            title: `Buying ${token.symbol}`,
            subtitle: `${walletsArray.length} wallet${walletsArray.length > 1 ? 's' : ''} • ${formatNumberWithCommas(totalAmount, 2)} MON`,
            amount: totalAmount.toString(),
            amountUnit: 'MON',
            tokenImage: token.image,
          });

          try {
            const buyPromises = [];
            for (const walletAddr of walletsArray) {
              const wallet = subWallets.find((w) => w.address === walletAddr);
              if (!wallet) continue;

              const value = BigInt(Math.round(amountPerWallet * 1e18));

              let uo;
              if (isNadFun) {
                if (token.migrated) {
                  let minOutput = BigInt(Math.floor(Number(value) / (token.price || 1) * (1 - Number(buySlippageValue) / 100)))
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
                        to: walletAddr as `0x${string}`,
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
                        recipient: walletAddr as `0x${string}`,
                        buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
                    }),
                    value,
                  };
                }
                else {
                  const fee = 99000n;
                  const iva = value * fee / 100000n;
                  const vNative = token.reserveQuote + iva;
                  const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
                  const output = Math.floor(Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100))));

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
                        to: walletAddr as `0x${string}`,
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
                        recipient: walletAddr as `0x${string}`,
                        buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
                    }),
                    value,
                  };
                }
              } else {
                const fee = 99000n;
                const iva = value * fee / 100000n;
                const vNative = token.reserveQuote + iva;
                const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
                const output = Math.floor(Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100))));

                uo = {
                  target: contractAddress as `0x${string}`,
                  data: encodeFunctionData({
                    abi: CrystalRouterAbi,
                    functionName: 'buy',
                    args: [true, token.id as `0x${string}`, value, BigInt(output)],
                  }),
                  value,
                };
              }

              const walletNonce = nonces.current.get(walletAddr);
              const params = [
                { uo },
                0n,
                0n,
                false,
                wallet.privateKey,
                walletNonce?.nonce, false, false, 1, walletAddr
              ];
              if (walletNonce) walletNonce.nonce += 1;
              walletNonce?.pendingtxs.push(params);

              const buyPromise = sendUserOperationAsync(...params)
                .then(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return [true, amountPerWallet];
                })
                .catch(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return [false, 0];
                });
              buyPromises.push(buyPromise);
            }

            const results = await Promise.allSettled(buyPromises);
            const successfulBuys = results.filter(
              (result) => result.status === 'fulfilled' && result.value?.[0] === true,
            ).length;
            const total = results.reduce(
              (a, r) => r.status === 'fulfilled' ? a + r.value[1] : a,
              0
            );
            updatePopup?.(txId, {
              title: 'Buy Complete',
              subtitle: `${successfulBuys}/${walletsArray.length} wallet${walletsArray.length > 1 ? 's' : ''} • Spent ~${formatNumberWithCommas(total, 2)} ${'MON'}`,
              variant: 'success',
              isLoading: false,
            });

            terminalRefetch();
            playTradeSound(true);
          } catch (error: any) {
            updatePopup?.(txId, {
              title: 'Buy Failed',
              subtitle: error?.message || 'Failed to complete buy',
              variant: 'error',
              isLoading: false,
            });
          }
        } else {
          const isNadFun = token.source === 'nadfun';
          const contractAddress = isNadFun
            ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
            : routerAddress;

          txId = walletPopup.showBuyTransaction(
            tradeAmount,
            'MON',
            token.symbol,
            token.image,
          );

          const valNum = parseFloat(tradeAmount);
          const value = BigInt(Math.round(valNum * 1e18));

          let uo;
          if (isNadFun) {
            if (token.migrated) {
              let minOutput = BigInt(Math.floor(Number(value) / (token.price || 1) * (1 - Number(buySlippageValue) / 100)))
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
                    to: account.address as `0x${string}`,
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
                    recipient: account.address as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
                }),
                value,
              };
            }
            else {
              const fee = 99000n;
              const iva = value * fee / 100000n;
              const vNative = token.reserveQuote + iva;
              const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
              const output = Math.floor(Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100))));

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
                    to: account.address as `0x${string}`,
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
                    recipient: account.address as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
                }),
                value,
              };
            }
          } else {
            const fee = 99000n;
            const iva = value * fee / 100000n;
            const vNative = token.reserveQuote + iva;
            const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
            const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100)));

            uo = {
              target: contractAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'buy',
                args: [true, token.id as `0x${string}`, value, BigInt(output)],
              }),
              value,
            };
          }

          walletPopup.updateTransactionConfirming(
            txId,
            tradeAmount,
            'MON',
            token.symbol,
          );
          await sendUserOperationAsync({ uo });
          walletPopup.updateTransactionSuccess(txId, {
            tokenAmount: Number(0),
            spentAmount: Number(tradeAmount),
            tokenSymbol: token.symbol,
            currencyUnit: 'MON',
          });

          terminalRefetch();
          playTradeSound(true);
        }
      } else {
        if (selectedWallets.size > 0) {
          const walletsArray = Array.from(selectedWallets);

          const walletsWithTokens = walletsArray.filter((addr) => {
            const balance = walletTokenBalances?.[addr]?.[token.id];
            return balance && balance > 0n;
          });

          if (walletsWithTokens.length === 0) {
            throw new Error('No selected wallets have tokens to sell');
            return;
          }

          const isNadFun = token.source === 'nadfun';
          const sellContractAddress = isNadFun
            ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
            : routerAddress;

          txId = `multisell-${Date.now()}`;

          const sellPromises = [];
          if (sellInputMode != 'percentage') {
            showLoadingPopup?.(txId, {
              title: `Selling ${token.symbol}`,
              subtitle: `${walletsWithTokens.length} wallet${walletsWithTokens.length > 1 ? 's' : ''} • ${formatNumberWithCommas(parseFloat(tradeAmount), 2)} ${'MON'}`,
              amount: (parseFloat(tradeAmount)).toString(),
              amountUnit: token.symbol,
              tokenImage: token.image,
            });
            const totalAmt = BigInt(Math.round(parseFloat(tradeAmount) * 1e18 / 0.99));

            for (const walletAddr of walletsWithTokens) {
              const wallet = subWallets.find((w) => w.address === walletAddr);
              if (!wallet) continue;

              const walletBalance = walletTokenBalances?.[walletAddr]?.[token.id] || 0n;

              let amountTokenWei = totalAmt / BigInt(walletsWithTokens.length);

              if (amountTokenWei <= 0n) continue;

              let sellUo;
              if (isNadFun) {
                const actions: any = []
                let inputAmountWei = BigInt(Math.floor(Number(amountTokenWei) / (token.price || 1) * (1 + Number(sellSlippageValue) / 100)))
                const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
                const sellToken = token.id as `0x${string}`
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
                if ((token?.allowances?.[walletAddr.toLowerCase()]?.allowance || 0n) < inputAmountWei) {
                  const nonce = token?.allowances?.[walletAddr.toLowerCase()]?.nonce ?? 0n

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
                        owner: walletAddr,
                        spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                        value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                        nonce,
                        deadline,
                      },
                    }, wallet.privateKey
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
                        walletAddr as `0x${string}`,
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
                    args: [settings.chainConfig[activechain].zeroXAllowanceHolder, walletAddr as `0x${string}`, settings.chainConfig[activechain].nadFunLens, inputAmountWei, amountTokenWei, sellToken, settler, deadline],
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
                  args: [settings.chainConfig[activechain].eth, 10000n, walletAddr as `0x${string}`, 0n, '0x'],
                }))
                sellUo = {
                  target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'exec',
                    args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                      abi: zeroXAbi,
                      functionName: 'execute',
                      args: [{
                        recipient: walletAddr as `0x${string}`,
                        buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                    })],
                  }),
                  value: 0n,
                };
              } else {
                sellUo = {
                  target: routerAddress as `0x${string}`,
                  data: encodeFunctionData({
                    abi: CrystalRouterAbi,
                    functionName: 'sell',
                    args: [
                      true,
                      token.id as `0x${string}`,
                      amountTokenWei,
                      0n,
                    ],
                  }),
                  value: 0n,
                };
              }

              const walletNonce = nonces.current.get(walletAddr);
              const params = [
                { uo: sellUo },
                0n,
                0n,
                false,
                wallet.privateKey,
                walletNonce?.nonce, false, false, 1, walletAddr
              ];
              if (walletNonce) walletNonce.nonce += 1;
              walletNonce?.pendingtxs.push(params);

              const sellPromise = sendUserOperationAsync(...params)
                .then(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return true;
                })
                .catch(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return false;
                });
              sellPromises.push(sellPromise);
            }
          }
          else {
            const pct = BigInt(parseInt(tradeAmount));
            showLoadingPopup?.(txId, {
              title: `Selling ${token.symbol}`,
              subtitle: `${walletsWithTokens.length} wallet${walletsWithTokens.length > 1 ? 's' : ''} • ${formatNumberWithCommas(parseFloat(tradeAmount), 2)}%`,
              amount: (parseFloat(tradeAmount)).toString(),
              amountUnit: token.symbol,
              tokenImage: token.image,
            });
            for (const walletAddr of walletsWithTokens) {
              const wallet = subWallets.find((w) => w.address === walletAddr);
              if (!wallet) continue;

              const walletBalance = walletTokenBalances?.[walletAddr]?.[token.id] || 0n;

              let amountTokenWei = BigInt(pct) >= 100n ? walletBalance : (walletBalance * pct) / 100n

              if (amountTokenWei <= 0n) continue;

              let sellUo;
              if (isNadFun) {
                const actions: any = []
                let inputAmountWei = BigInt(Math.floor(Number(amountTokenWei) * token.price * (1 - Number(sellSlippageValue) / 100)))
                const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
                const sellToken = token.id as `0x${string}`
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
                if ((token?.allowances?.[walletAddr.toLowerCase()]?.allowance || 0n) < amountTokenWei) {
                  const nonce = token?.allowances?.[walletAddr.toLowerCase()]?.nonce ?? 0n

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
                        owner: walletAddr,
                        spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                        value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                        nonce,
                        deadline,
                      },
                    }, wallet.privateKey
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
                        walletAddr as `0x${string}`,
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
                    args: [settings.chainConfig[activechain].zeroXAllowanceHolder, sellToken, walletAddr as `0x${string}`, settler, amountTokenWei],
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
                  args: [settings.chainConfig[activechain].eth, 10000n, walletAddr as `0x${string}`, 0n, '0x'],
                }))
                sellUo = {
                  target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'exec',
                    args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                      abi: zeroXAbi,
                      functionName: 'execute',
                      args: [{
                        recipient: walletAddr as `0x${string}`,
                        buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                    })],
                  }),
                  value: 0n,
                };
              } else {
                sellUo = {
                  target: routerAddress as `0x${string}`,
                  data: encodeFunctionData({
                    abi: CrystalRouterAbi,
                    functionName: 'sell',
                    args: [
                      true,
                      token.id as `0x${string}`,
                      amountTokenWei,
                      0n,
                    ],
                  }),
                  value: 0n,
                };
              }

              const walletNonce = nonces.current.get(walletAddr);
              const params = [
                { uo: sellUo },
                0n,
                0n,
                false,
                wallet.privateKey,
                walletNonce?.nonce, false, false, 1, walletAddr
              ];
              if (walletNonce) walletNonce.nonce += 1;
              walletNonce?.pendingtxs.push(params);

              const sellPromise = sendUserOperationAsync(...params)
                .then(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return true;
                })
                .catch(() => {
                  if (walletNonce)
                    walletNonce.pendingtxs = walletNonce.pendingtxs.filter(
                      (p: any) => p[5] != params[5],
                    );
                  return false;
                });
              sellPromises.push(sellPromise);
            }
          }

          const results = await Promise.allSettled(sellPromises);
          const successfulSells = results.filter(
            (result) => result.status === 'fulfilled' && result.value === true,
          ).length;


          updatePopup?.(txId, {
            title: 'Sell Complete',
            subtitle: `${successfulSells}/${walletsWithTokens.length} wallet${walletsWithTokens.length > 1 ? 's' : ''}`,
            variant: 'success',
            isLoading: false,
          });
          terminalRefetch();
          playTradeSound(false);
        } else {
          txId = walletPopup.showSellTransaction(
            tradeAmount,
            'MON',
            token.symbol,
            token.image,
          );

          let amountTokenWei: bigint;
          let isExactInput: boolean;

          if (sellInputMode === 'percentage') {
            amountTokenWei = parseFloat(tradeAmount) >= 100 ? walletTokenBalances?.[userAddr]?.[token.id] : BigInt(Math.floor(Number(walletTokenBalances?.[userAddr]?.[token.id]) * parseFloat(tradeAmount) / 100));
            isExactInput = true;
          } else {
            amountTokenWei = BigInt(Math.round(parseFloat(tradeAmount) * 1e18 / 0.99));
            isExactInput = false;
          }

          const currentBalance =
            walletTokenBalances?.[userAddr]?.[token.id] || 0n;

          if (currentBalance <= 0n) {
            throw new Error(walletPopup.texts.INSUFFICIENT_TOKEN_BALANCE);
          }
          const isNadFun = token.source === 'nadfun';
          const sellContractAddress = isNadFun
            ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
            : routerAddress;

          walletPopup.updateTransactionConfirming(
            txId,
            tradeAmount,
            sellInputMode == 'percentage' ? '%' : 'MON',
            token.symbol,
          );
          let sellUo;
          if (isNadFun && sellInputMode != 'percentage') {
            const actions: any = []
            let inputAmountWei = BigInt(Math.floor(Number(amountTokenWei) / (token.price || 1) * (1 + Number(sellSlippageValue) / 100)))
            const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
            const sellToken = token.id as `0x${string}`
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
            if ((token?.allowances?.[account.address.toLowerCase()]?.allowance || 0n) < inputAmountWei) {
              const nonce = token?.allowances?.[account.address.toLowerCase()]?.nonce ?? 0n

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
                    owner: account.address,
                    spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                    value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    nonce,
                    deadline,
                  },
                }
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
                    account.address as `0x${string}`,
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
                args: [settings.chainConfig[activechain].zeroXAllowanceHolder, account.address as `0x${string}`, settings.chainConfig[activechain].nadFunLens, inputAmountWei, amountTokenWei, sellToken, settler, deadline],
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
              args: [settings.chainConfig[activechain].eth, 10000n, account.address as `0x${string}`, 0n, '0x'],
            }))
            sellUo = {
              target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'exec',
                args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                  abi: zeroXAbi,
                  functionName: 'execute',
                  args: [{
                    recipient: account.address as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                })],
              }),
              value: 0n,
            };
          }
          else if (isNadFun) {
            const actions: any = []
            let inputAmountWei = BigInt(Math.floor(Number(amountTokenWei) * token.price * (1 - Number(sellSlippageValue) / 100)))
            const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
            const sellToken = token.id as `0x${string}`
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
            if ((token?.allowances?.[account.address.toLowerCase()]?.allowance || 0n) < amountTokenWei) {
              const nonce = token?.allowances?.[account.address.toLowerCase()]?.nonce ?? 0n

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
                    owner: account.address,
                    spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                    value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    nonce,
                    deadline,
                  },
                }
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
                    account.address as `0x${string}`,
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
                args: [settings.chainConfig[activechain].zeroXAllowanceHolder, sellToken, account.address as `0x${string}`, settler, amountTokenWei],
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
              args: [settings.chainConfig[activechain].eth, 10000n, account.address as `0x${string}`, 0n, '0x'],
            }))
            sellUo = {
              target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'exec',
                args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                  abi: zeroXAbi,
                  functionName: 'execute',
                  args: [{
                    recipient: account.address as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                })],
              }),
              value: 0n,
            };
          } else {
            sellUo = {
              target: sellContractAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'sell',
                args: [
                  isExactInput,
                  token.id as `0x${string}`,
                  amountTokenWei,
                  0n,
                ],
              }),
              value: 0n,
            };
          }

          await sendUserOperationAsync({ uo: sellUo });

          walletPopup.updateTransactionSuccess(txId, {
            tokenAmount: Number(tradeAmount),
            tokenSymbol: token.symbol,
            currencyUnit: 'MON',
          });

          terminalRefetch();
          playTradeSound(false);
        }
      }

      setTradeAmount('');
      setLimitPrice('');
      setSliderPercent(0);
    } catch (e: any) {
      console.error(e);
      walletPopup.updateTransactionError(
        txId!,
        e?.message || walletPopup.texts.PLEASE_TRY_AGAIN,
      );
    } finally {
      setIsSigning(false);
    }
  };

  const getButtonText = () => {
    if (!account.connected) return walletPopup.texts.CONNECT_WALLET;
    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId)
      return `${walletPopup.texts.SWITCH_CHAIN} to ${settings.chainConfig[activechain]?.name || 'Monad'}`;
    if (activeOrderType === 'market')
      return `${activeTradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`;
    return `Set ${activeTradeType === 'buy' ? 'Buy' : 'Sell'} Limit`;
  };

  const isTradeDisabled = () => {
    if (!account.connected) return false;
    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) return false;
    if (isSigning) return true;
    if (!tradeAmount) return true;
    if (activeOrderType === 'Limit' && !limitPrice) return true;
    return false;
  };

  const readTf = (tf: '5m' | '1h' | '6h' | '24h') => {
    const s = statsRaw || {};

    const getNum = (base: string) =>
      Number((s as any)[`${base}_${tf}`] ?? 0);

    const volume = getNum('volume_usd');
    const buyVolume = getNum('buy_volume_usd');
    const sellVolume = getNum('sell_volume_usd');

    const buyTransactions = Number(
      (s as any)[`buy_tx_count_${tf}`] ??
      (s as any)[`buy_count_${tf}`] ??
      0,
    );
    const sellTransactions = Number(
      (s as any)[`sell_tx_count_${tf}`] ??
      (s as any)[`sell_count_${tf}`] ??
      0,
    );

    return {
      change: buyVolume - sellVolume,
      volume,
      buyTransactions,
      sellTransactions,
      buyVolume,
      sellVolume,
    };
  };

  const currentStats = readTf(
    (selectedStatsTimeframe as '5m' | '1h' | '6h' | '24h') ?? '24h',
  );

  const pctForTf = useCallback(
    (tf: '5m' | '1h' | '6h' | '24h') => {
      const s = statsRaw as any;
      if (!s) return '—';

      const keyChange = `change_pct_${tf}`;
      const keyStart = `start_price_native_${tf}`;
      const keyLast = `last_price_native_${tf}`;

      let pct: number | null = null;

      if (typeof s[keyChange] === 'number') {
        pct = s[keyChange];
      } else if (
        typeof s[keyStart] === 'number' &&
        typeof s[keyLast] === 'number' &&
        s[keyStart] !== 0
      ) {
        pct =
          ((s[keyLast] - s[keyStart]) / s[keyStart]) *
          100;
      }

      if (pct == null || !isFinite(pct)) return '0%';
      const sign = pct > 0 ? '+' : '';
      return `${sign}${pct.toFixed(2)}%`;
    },
    [statsRaw],
  );

  return (
    <div className="meme-interface-container">
      {notif && (
        <div
          className={`meme-notif-popup ${notif.variant || 'info'}${notif.visible === false ? ' hide' : ''}`}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 260,
          }}
        >
          <div className="meme-notif-content">
            <div className="meme-notif-title">{notif.title}</div>
            {notif.subtitle && (
              <div className="meme-notif-subtitle">{notif.subtitle}</div>
            )}
          </div>
          <button
            className="meme-notif-close"
            onClick={closeNotif}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            &times;
          </button>
        </div>
      )}

      <div className="meme-mobile-view-toggle">
        <div
          className="meme-mobile-toggle-slider"
          style={{
            transform: `translateX(${getSliderPosition(mobileActiveView) * 100}%)`,
          }}
        />
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'chart' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('chart')}
        >
          Chart
        </button>
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'trades' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('trades')}
        >
          Trades
        </button>
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'ordercenter' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('ordercenter')}
        >
          Tables
        </button>
      </div>

      <div className="memechartandtradesandordercenter">
        <div className="memecharttradespanel">
          <div
            className={`meme-chart-container ${mobileActiveView !== 'chart' ? 'mobile-hidden' : ''}`}
          >
            <MemeChart
              token={token}
              data={chartData}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
              realtimeCallbackRef={realtimeCallbackRef}
              monUsdPrice={monUsdPrice}
              tradehistory={trades}
              isMarksVisible={true}
              address={address}
              devAddress={token.dev}
              trackedAddresses={[
                String(address || '').toLowerCase(),
                String(token?.dev || '').toLowerCase(),
                ...subWallets.map(w => String(w.address || '').toLowerCase()),
                ...trackedAddresses,
                ...trackedWalletsRef.current
              ]
              }
              selectedIntervalRef={selectedIntervalRef}
            />
          </div>
          <div
            className={`meme-trades-container ${mobileActiveView !== 'trades' ? 'mobile-hidden' : ''}`}
            style={{ display: isTradesTabVisible ? 'none' : 'flex' }}
          >
            <MemeTradesComponent
              tokenList={tokenList}
              trades={trades}
              tokendict={tokendict}
              wethticker={wethticker}
              ethticker={ethticker}
              onMarketSelect={onMarketSelect}
              setSendTokenIn={setSendTokenIn}
              setpopup={setpopup}
              holders={holders}
              currentUserAddress={scaAddress}
              devAddress={token.dev}
              monUsdPrice={monUsdPrice}
              trackedAddresses={trackedAddresses}
              onFilterDev={setTrackedToDev}
              onFilterYou={setTrackedToYou}
              onFilterSet={setTrackedToSet}
              onClearTracked={clearTracked}
              isLoadingTrades={isLoadingTrades || isOCTradesHovered}
              subWallets={subWallets}
              marketsData={marketsData}
              trackedWalletsRef={trackedWalletsRef}
              positions={positions}
              onSellPosition={handleSellPosition}
              onShareDataSelected={onTokenDataChange}
            />
          </div>
        </div>
        <div
          className={`meme-ordercenter ${mobileActiveView !== 'ordercenter' ? 'mobile-hidden' : ''}`}
        >
          <MemeOrderCenter
            orderCenterHeight={orderCenterHeight}
            isVertDragging={isVertDragging}
            isOrderCenterVisible={true}
            onHeightChange={(h: any) => setOrderCenterHeight(h)}
            onDragStart={(e: any) => {
              initialMousePosRef.current = e.clientY;
              initialHeightRef.current = orderCenterHeight;
              setIsVertDragging(true);
              document.body.style.cursor = 'row-resize';
              document.body.style.userSelect = 'none';
            }}
            onDragEnd={() => {
              setIsVertDragging(false);
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            }}
            isWidgetOpen={isWidgetOpen}
            onToggleWidget={() => {
              localStorage.setItem(
                'crystal_quickbuy_widget_open',
                JSON.stringify(!isWidgetOpen),
              );
              setIsWidgetOpen(!isWidgetOpen);
            }}
            holders={holders}
            positions={positions}
            topTraders={topTraders}
            devTokens={devTokens}
            trades={trades}
            isTradesTabVisible={isTradesTabVisible}
            onToggleTradesTab={() => setIsTradesTabVisible(!isTradesTabVisible)}
            monUsdPrice={monUsdPrice}
            trackedWalletsMap={trackedWalletsMap}
            userAddressesSet={userAddressesSet}
            page={page}
            pageSize={PAGE_SIZE}
            currentPrice={currentPrice}
            onSellPosition={handleSellPosition}
            trackedAddresses={trackedAddresses}
            onToggleTrackedAddress={toggleTrackedAddress}
            token={token}
            subWallets={subWallets}
            walletTokenBalances={walletTokenBalances}
            tokendict={tokendict}
            userAddr={address ?? account?.address ?? ''}
            nonces={nonces}
            activeWalletPrivateKey={activeWalletPrivateKey}
            onFilterDev={setTrackedToDev}
            onFilterYou={setTrackedToYou}
            onFilterTracked={setTrackedToSet}
            devAddress={token.dev}
            onTradesHoverChange={setIsOCTradesHovered}
            tokenList={tokenList}
            marketsData={marketsData}
            setSendTokenIn={setSendTokenIn}
            setpopup={setpopup}
            trackedWalletsRef={trackedWalletsRef}
            onShareDataSelected={onTokenDataChange}
          />
        </div>
      </div>

      <div className="meme-trade-panel desktop-only">
        <div
          className="meme-trading-stats-enhanced"
          onMouseEnter={() => setHoveredStatsContainer(true)}
          onMouseLeave={() => setHoveredStatsContainer(false)}
        >
          <div className="top-stats-grid">
            <div className="stat-group-vol">
              <span className="stat-label">{selectedStatsTimeframe} Vol</span>
              <span className="stat-value">
                ${formatNumberWithCommas(currentStats.volume, 1)}
              </span>
            </div>

            <div className="stat-group buys">
              <span className="stat-label">Buys</span>
              <span className="stat-value green">
                {formatNumberWithCommas(currentStats.buyTransactions, 0)} / $
                {formatNumberWithCommas(currentStats.buyVolume, 1)}
              </span>
            </div>

            <div className="stat-group sells">
              <span className="stat-label">Sells</span>
              <span className="stat-value red">
                {formatNumberWithCommas(currentStats.sellTransactions, 0)} / $
                {formatNumberWithCommas(currentStats.sellVolume, 1)}
              </span>
            </div>

            <div className="stat-group-net-vol">
              <span className="stat-label">Net Vol.</span>
              <span
                className="stat-value"
                style={{
                  color:
                    currentStats.buyVolume - currentStats.sellVolume > 0
                      ? 'rgb(67 254 154)'
                      : currentStats.buyVolume - currentStats.sellVolume < 0
                        ? 'rgb(235 112 112)'
                        : 'white',
                }}
              >
                {currentStats.buyVolume - currentStats.sellVolume < 0
                  ? '-'
                  : ''}
                $
                {formatNumberWithCommas(
                  Math.abs(
                    (currentStats.buyVolume - currentStats.sellVolume)
                  ),
                  1,
                )}
              </span>
            </div>
          </div>

          <div
            className={`stats-hover-overlay ${hoveredStatsContainer ? 'visible' : ''}`}
          >
            <div className="stats-blur-backdrop" />

            <div className="overlay-controls-grid">
              <div className="timeframe-buttons">
                {(['5m', '1h', '6h', '24h'] as const).map((v) => (
                  <button
                    key={v}
                    className={`timeframe-toggle ${selectedStatsTimeframe === v ? 'active' : ''}`}
                    onClick={() => setSelectedStatsTimeframe(v)}
                  >
                    <span className="tf-label">{v}</span>
                    <span
                      className="tf-percentage"
                      style={{
                        color: (() => {
                          const s = pctForTf(v);
                          if (s === '—') return 'var(--muted, #9a9ba4)';

                          const num = parseFloat(
                            s.trim().replace('−', '-').replace(/[+%]/g, ''),
                          );

                          if (!isFinite(num)) return 'var(--muted, #9a9ba4)';

                          return num >= 0
                            ? 'rgb(67 254 154)'
                            : 'rgb(235 112 112)';
                        })(),
                      }}
                    >
                      {pctForTf(v)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="indicator-legend">
            <div className="indicator-line green-line" />
            <div className="indicator-line red-line" />
          </div>
        </div>
        <div className="meme-buy-sell-container">
          <button
            className={`meme-buy-button ${activeTradeType === 'buy' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTradeType('buy')}
          >
            Buy
          </button>
          <button
            className={`meme-sell-button ${activeTradeType === 'sell' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTradeType('sell')}
          >
            Sell
          </button>
        </div>
        <div className="meme-trade-inputs-row">
          <div className="meme-order-type-container">
            <span>Market</span>
            <Tooltip content="Limit orders coming soon">
              <span style={{ color: '#e0e8fd73', cursor: 'not-allowed', marginTop: '0.5px' }}>Limit</span>
            </Tooltip>
          </div>
          <div className="meme-wallet-dropdown-container" ref={walletDropdownRef}>
            <button
              className={`meme-wallet-dropdown-trigger ${isWalletDropdownOpen ? 'active' : ''}`}
              onClick={() => {
                if (!address) {
                  setpopup(4);
                } else {
                  setIsWalletDropdownOpen(!isWalletDropdownOpen);
                }
              }}
            >
              <img src={walleticon} className="meme-wallet-icon" alt="Wallets" />
              {selectedWallets.size == 0 ? <Tooltip content="Primary Wallet">
                {(
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d8dcff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
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
              </Tooltip> :
                <span className="meme-wallet-count">{selectedWallets.size}</span>}
              {activeTradeType == 'buy' ? <div className="meme-wallet-total-balance">
                <img src={monadicon} className="meme-wallet-mon-small-icon" alt="MON" />
                <span>{formatNumberWithCommas(getTotalSelectedWalletsBalance(), 2)}</span>
              </div> :
                <><div className="meme-wallet-total-balance" style={{ marginRight: '8px' }}>
                  <img src={token.image} className="meme-wallet-mon-small-icon" alt="MON" />
                  <span>{formatNumberWithCommas(getTotalSelectedWalletsTokenBalance(), 2)}</span>
                </div>
                  <div className="meme-wallet-total-balance">
                    <img src={monadicon} className="meme-wallet-mon-small-icon" alt="MON" />
                    <span>{formatNumberWithCommas(getTotalSelectedWalletsTokenBalance() * token.price, 2)}</span>
                  </div>
                </>}
            </button>
          </div>
        </div>
        {isWalletDropdownOpen && account.connected && (
          <div className="meme-wallet-dropdown-panel" ref={walletDropdownPanelRef}>
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
                  <div className="meme-wallet-dropdown-header">
                    <div className="meme-wallet-dropdown-actions">
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
                              className="meme-wallet-action-btn select-all"
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
                                className="meme-wallet-merge-btn consolidate"
                                onClick={handleConsolidateTokens}
                                disabled={
                                  !hasExactlyOneSelected ||
                                  !hasSourceWallets ||
                                  isConsolidating
                                }
                              >
                                <img src={merge} className="merge-icon" alt="Consolidate" />
                                Consolidate
                              </button>
                            </Tooltip>
                            <Tooltip content="Split tokens across selected wallets with 20% variance">
                              <button
                                className="meme-wallet-merge-btn split"
                                onClick={handleSplitTokens}
                                disabled={selectedWallets.size < 2 || isSplitting}
                              >
                                <img src={merge} className="merge-icon" alt="Split" />
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
                              className="meme-wallet-action-btn select-all"
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
                              className="meme-wallet-action-btn select-all"
                              onClick={selectAllWithBalance}
                            >
                              Select All With Balance
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                    <button
                      className="meme-wallet-dropdown-close"
                      onClick={() => setIsWalletDropdownOpen(false)}
                    >
                      <img
                        src={closebutton}
                        className="meme-wallet-dropdown-close-icon"
                        alt="Close"
                      />
                    </button>
                  </div>

                  <div className="meme-wallet-dropdown-list">
                    <>
                      {walletsWithToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isSelected = selectedWallets.has(wallet.address);
                        const tokenBalance = getWalletTokenBalance(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);

                        return (
                          <div
                            key={wallet.address}
                            className={`meme-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleWalletSelection(wallet.address)}
                          >
                            <div className="meme-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="meme-wallet-checkbox"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div className="meme-wallet-info">
                              <div className="meme-wallet-name">
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
                                className="meme-wallet-address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.address, 'Wallet address copied');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {wallet.address.slice(0, 4)}...
                                {wallet.address.slice(-4)}
                                <svg
                                  className="meme-wallet-address-copy-icon"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                </svg>
                              </div>
                            </div>

                            <div className="meme-wallet-balance">
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  settings.chainConfig[activechain]?.eth
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`meme-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="meme-wallet-mon-icon"
                                        alt="MON"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>

                            <div className="meme-wallet-tokens">
                              {tokenBalance > 0 ? (
                                <Tooltip content="Tokens">
                                  <div
                                    className={`meme-wallet-token-amount ${isBlurred ? 'blurred' : ''}`}
                                  >
                                    {token.image && (
                                      <img
                                        src={token.image}
                                        className="meme-wallet-token-icon"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="meme-wallet-token-balance">
                                      {formatNumberWithCommas(tokenBalance, 2)}
                                    </span>
                                  </div>
                                </Tooltip>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                      {hasTokenHolders && walletsWithoutToken.length > 0 && (
                        <div className="meme-wallets-section-label">
                          <button
                            className="meme-wallet-action-btn"
                            onClick={() => {
                              if (allWithoutSelected) {
                                setSelectedWallets((prev) => {
                                  const next = new Set(prev);
                                  walletsWithoutTokenAddrs.forEach((a) => next.delete(a));
                                  return next;
                                });
                              } else {
                                setSelectedWallets((prev) => {
                                  const next = new Set(prev);
                                  walletsWithoutTokenAddrs.forEach((a) => next.add(a));
                                  return next;
                                });
                              }
                            }}
                          >
                            {allWithoutSelected ? 'Unselect All' : 'Select All'}
                          </button>

                          <button
                            className="meme-wallet-action-btn"
                            onClick={selectAllWithBalanceWithoutToken}
                          >
                            Select All With Balance
                          </button>
                        </div>
                      )}

                      {walletsWithoutToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isSelected = selectedWallets.has(wallet.address);
                        const tokenCount = getWalletTokenCount(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);

                        return (
                          <div
                            key={wallet.address}
                            className={`meme-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleWalletSelection(wallet.address)}
                          >
                            <div className="meme-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="meme-wallet-checkbox"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div className="meme-wallet-info">
                              <div className="meme-wallet-name">
                                {getWalletName(
                                  wallet.address,
                                  index + walletsWithToken.length,
                                )}
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
                                className="meme-wallet-address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.address, 'Wallet address copied');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {wallet.address.slice(0, 4)}...
                                {wallet.address.slice(-4)}
                                <svg
                                  className="meme-wallet-address-copy-icon"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                </svg>
                              </div>
                            </div>

                            <div className="meme-wallet-balance">
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  settings.chainConfig[activechain]?.eth
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`meme-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="meme-wallet-mon-icon"
                                        alt="MON"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>

                            <div className="meme-wallet-tokens">
                              <Tooltip content="Tokens">
                                <div className="meme-wallet-token-count">
                                  <div className="meme-wallet-token-structure-icons">
                                    <div className="token1"></div>
                                    <div className="token2"></div>
                                    <div className="token3"></div>
                                  </div>
                                  <span className="meme-wallet-total-tokens">
                                    {tokenCount}
                                  </span>
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}

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
                    </>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <div className="meme-trade-panel-content">
          <div className="meme-trade-input-wrapper">
            <input
              type="decimal"
              placeholder="0.00"
              value={tradeAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (!/^\d*\.?\d{0,18}$/.test(value)) return;
                if (activeTradeType === 'sell' && sellInputMode === 'percentage') {
                  const percent = parseFloat(value) || 0;
                  setSliderPercent(Math.min(100, Math.max(0, percent)));
                  setTradeAmount(value);
                }
                else if (activeTradeType == 'buy') {
                  const currentBalance = getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18) > 0
                    ? getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18)
                    : 0;
                  const currentAmount = parseFloat(value) || 0;
                  const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
                  setSliderPercent(percentage);
                  setTradeAmount(value);
                }
                else {
                  const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                  const currentAmount = parseFloat(value) || 0;
                  const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
                  setSliderPercent(percentage);
                  setTradeAmount(value);
                }
              }}
              className="meme-trade-input"
              autoFocus
            />
            <div
              className="meme-trade-currency"
              style={{ cursor: activeTradeType === 'sell' ? 'pointer' : 'default' }}
              onClick={() => {
                if (activeTradeType === 'sell') {
                  setSellInputMode(prev => {
                    const newMode = prev === 'percentage' ? 'token' : 'percentage';

                    const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                    if (newMode === 'percentage') {
                      const currentAmount = parseFloat(tradeAmount) || 0;
                      const percentage = currentBalance > 0 ? (currentAmount / currentBalance) * 100 : 0;
                      setTradeAmount(percentage == 0 ? '' : percentage.toFixed(2));
                      setSliderPercent(percentage);
                    } else {
                      const percentage = parseFloat(tradeAmount) || 0;
                      const tokenAmount = (currentBalance * percentage) / 100;
                      setTradeAmount(tokenAmount == 0 ? '' : formatTradeAmount(tokenAmount));
                    }

                    return newMode;
                  });
                }
              }}
            >
              {activeTradeType === 'buy' ? (
                <img className="meme-currency-monad-icon" src={monadicon} />
              ) : (
                sellInputMode === 'percentage' ? (
                  <span style={{ fontSize: '1rem', fontWeight: '500' }}>%</span>
                ) : (
                  <img className="meme-currency-monad-icon" src={monadicon} />
                )
              )}
            </div>
          </div>
          {activeOrderType === 'Limit' && (
            <div className="meme-trade-input-wrapper">
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="meme-trade-input"
              />
              <div className="meme-trade-currency">Market Cap</div>
            </div>
          )}
          <div className="meme-balance-slider-wrapper">
            {sliderMode === 'presets' && (
              <div className="meme-slider-container meme-presets-mode">
                <div className="meme-preset-buttons">
                  {monPresets.map((preset: number, index: number) => (
                    <div key={index} className="meme-preset-button-container">
                      {editingPresetIndex === index ? (
                        <input
                          ref={presetInputRef}
                          type="number"
                          value={tempPresetValue}
                          onChange={(e) => setTempPresetValue(e.target.value)}
                          onKeyDown={handlePresetInputKeyDown}
                          onBlur={handlePresetInputSubmit}
                          className="meme-preset-edit-input"
                          min="0"
                          step="0.1"
                        />
                      ) : (
                        <button
                          className={`meme-preset-button ${isPresetEditMode ? 'edit-mode' : ''} ${selectedMonPreset === preset ? `active ${activeTradeType}` : ''}`}
                          onClick={() => handlePresetButtonClick(preset, index)}
                        >
                          {preset}
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="meme-preset-edit-container">
                    <button
                      className={`meme-preset-edit-button ${isPresetEditMode ? 'active' : ''}`}
                      onClick={handlePresetEditToggle}
                      title={
                        isPresetEditMode ? 'Exit Edit Mode' : 'Edit Presets'
                      }
                    >
                      <img
                        src={editicon}
                        className={`meme-preset-edit-icon ${isPresetEditMode ? 'active' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {sliderMode === 'increment' && (
              <div className="meme-slider-container meme-increment-mode">
                <button
                  className="meme-increment-button meme-minus"
                  onClick={() => {
                    const newPercent = Math.max(
                      0,
                      sliderPercent - sliderIncrement,
                    );
                    setSliderPercent(newPercent);
                    if (activeTradeType === 'buy') {
                      const currentBalance = getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18) > 0
                        ? getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18)
                        : 0;
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    } else {
                      const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                      if (sellInputMode === 'percentage') {
                        setTradeAmount(newPercent.toString());
                      } else {
                        const newAmount = (currentBalance * newPercent) / 100;
                        setTradeAmount(newAmount.toString());
                      }
                    }
                  }}
                  disabled={sliderPercent === 0}
                >
                  −
                </button>
                <div className="meme-increment-display">
                  <div className="meme-increment-amount">
                    {sliderIncrement}%
                  </div>
                </div>
                <button
                  className="meme-increment-button meme-plus"
                  onClick={() => {
                    const newPercent = Math.min(
                      100,
                      sliderPercent + sliderIncrement,
                    );
                    setSliderPercent(newPercent);
                    if (activeTradeType === 'buy') {
                      const currentBalance = getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18) > 0
                        ? getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18)
                        : 0;;
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    } else {
                      const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                      if (sellInputMode === 'percentage') {
                        setTradeAmount(newPercent.toString());
                      } else {
                        const newAmount = (currentBalance * newPercent) / 100;
                        setTradeAmount(newAmount.toString());
                      }
                    }
                  }}
                  disabled={sliderPercent === 100}
                >
                  +
                </button>
              </div>
            )}
            {sliderMode === 'slider' && (
              <div className="meme-slider-container meme-slider-mode">
                <input
                  ref={sliderRef}
                  type="range"
                  className={`meme-balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                  min="0"
                  max="100"
                  step="1"
                  value={sliderPercent}
                  onChange={(e) => {
                    const percent = parseInt(e.target.value);
                    setSliderPercent(percent);
                    positionPopup(percent);
                    if (percent == 0) {
                      setTradeAmount('')
                      return
                    }
                    if (activeTradeType === 'buy') {
                      const currentBalance = getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18) > 0
                        ? getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18)
                        : 0;;
                      const newAmount = (currentBalance * percent) / 100;
                      setTradeAmount(formatTradeAmount(newAmount));
                    } else {
                      const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                      if (sellInputMode === 'percentage') {
                        setTradeAmount(percent.toString());
                      } else {
                        const newAmount = (currentBalance * percent) / 100;
                        setTradeAmount(formatTradeAmount(newAmount));
                      }
                    }
                  }}
                  onMouseDown={() => {
                    setIsDragging(true);
                    positionPopup(sliderPercent);
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  style={{
                    background: `linear-gradient(to right, rgb(171, 176, 224) ${sliderPercent}%, rgb(21 21 27) ${sliderPercent}%)`,
                  }}
                />
                <div
                  ref={popupRef}
                  className={`meme-slider-percentage-popup ${isDragging ? 'visible' : ''}`}
                >
                  {sliderPercent}%
                </div>

                <div className="meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      key={markPercent}
                      className={`meme-balance-slider-mark ${activeTradeType}`}
                      data-active={sliderPercent >= markPercent}
                      data-percentage={markPercent}
                      onClick={() => {
                        setSliderPercent(markPercent);
                        if (activeTradeType === 'buy') {
                          const currentBalance = getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18) > 0
                            ? getTotalSelectedWalletsBalance() - (Number(settings.chainConfig[activechain].gasamount) / 1e18)
                            : 0;;
                          const newAmount =
                            (currentBalance * markPercent) / 100;
                          setTradeAmount(formatTradeAmount(newAmount));
                        } else {
                          const currentBalance = getTotalSelectedWalletsTokenBalance() * token.price;
                          if (sellInputMode === 'percentage') {
                            setTradeAmount(markPercent.toString());
                          } else {
                            const newAmount =
                              (currentBalance * markPercent) / 100;
                            setTradeAmount(formatTradeAmount(newAmount));
                          }
                        }
                        positionPopup(markPercent);
                      }}
                    >
                      {markPercent}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="meme-settings-toggle">
            <div className="meme-settings-collapsed">
              <Tooltip content="Slippage">
                <div className="meme-settings-item">
                  <img src={slippage} className="meme-settings-icon1" />
                  <span className="meme-settings-value">{activeTradeType === 'buy' ? buySlippageValue : sellSlippageValue}%</span>
                </div>
              </Tooltip>
              <Tooltip content="Priority Fee">
                <div className="meme-settings-item">
                  <img src={gas} className="meme-settings-icon2" />
                  <span className="meme-settings-value">{activeTradeType === 'buy' ? buyPriorityFee : sellPriorityFee}</span>
                </div>
              </Tooltip>
            </div>
          </div>
          {activeTradeType === 'buy' && (
            <div className="meme-advanced-trading-section">
              <div className="meme-advanced-trading-toggle">
                <div className="meme-advanced-trading-header">
                  <div className="meme-advanced-trading-icon-label">
                    <span className="meme-advanced-trading-label">
                      Advanced Trading Strategy
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={advancedTradingEnabled}
                    onChange={() =>
                      setAdvancedTradingEnabled(!advancedTradingEnabled)
                    }
                  />
                </div>

                {advancedTradingEnabled && (
                  <div className="meme-advanced-trading-content">
                    {advancedOrders.map((order) => (
                      <div key={order.id} className="meme-advanced-order-item">
                        <div className="meme-advanced-order-inputs">
                          {(order.type === 'takeProfit' ||
                            order.type === 'stopLoss') && (
                              <>
                                <div className="meme-advanced-order-input-group">
                                  <svg
                                    className="advanced-order-type-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgb(154 155 164)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      transform:
                                        order.type === 'stopLoss'
                                          ? 'rotate(180deg)'
                                          : 'none',
                                      paddingRight: '2px',
                                    }}
                                  >
                                    <path d="m5 12 7-7 7 7" />
                                    <path d="M12 19V5" />
                                  </svg>
                                  <span className="meme-advanced-order-input-label">
                                    {order.type === 'takeProfit' ? 'TP' : 'SL'}
                                  </span>
                                  <input
                                    type="text"
                                    className="meme-advanced-order-input"
                                    value={order.percentage || ''}
                                    onChange={(e) =>
                                      handleAdvancedOrderUpdate(
                                        order.id,
                                        'percentage',
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      order.type === 'takeProfit' ? '+0' : '-0'
                                    }
                                  />
                                  <span className="meme-advanced-order-unit">
                                    %
                                  </span>
                                </div>
                                <div className="meme-advanced-order-input-group">
                                  <span className="meme-advanced-order-input-label">
                                    Amount
                                  </span>
                                  <input
                                    type="number"
                                    className="meme-advanced-order-input"
                                    value={order.amount || ''}
                                    onChange={(e) =>
                                      handleAdvancedOrderUpdate(
                                        order.id,
                                        'amount',
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0"
                                  />
                                  <span className="meme-advanced-order-unit">
                                    %
                                  </span>
                                </div>
                                <button
                                  className="meme-advanced-order-remove"
                                  onClick={() =>
                                    handleAdvancedOrderRemove(order.id)
                                  }
                                >
                                  <img
                                    src={trash}
                                    className="meme-advanced-order-remove-icon"
                                    alt="Remove"
                                    width="14"
                                    height="14"
                                  />
                                </button>
                              </>
                            )}
                          {order.type === 'devSell' && (
                            <>
                              <div className="meme-advanced-order-input-group">
                                <svg
                                  className="advanced-order-type-icon"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="rgb(154 155 164)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 17V3" />
                                  <path d="m6 11 6 6 6-6" />
                                  <path d="M19 21H5" />
                                </svg>
                                <span className="meme-advanced-order-input-label">
                                  Sell Amount on Dev Sell
                                </span>
                                <input
                                  type="number"
                                  className="meme-advanced-order-input"
                                  value={order.percentage || ''}
                                  onChange={(e) =>
                                    handleAdvancedOrderUpdate(
                                      order.id,
                                      'percentage',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0"
                                />
                                <span className="meme-advanced-order-unit">
                                  %
                                </span>
                              </div>
                              <button
                                className="meme-advanced-order-remove"
                                onClick={() =>
                                  handleAdvancedOrderRemove(order.id)
                                }
                              >
                                <img
                                  src={trash}
                                  className="meme-advanced-order-remove-icon"
                                  alt="Remove"
                                  width="14"
                                  height="14"
                                />
                              </button>
                            </>
                          )}
                          {order.type === 'migration' && (
                            <>
                              <div className="meme-advanced-order-input-group">
                                <svg
                                  className="advanced-order-type-icon"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="rgb(154 155 164)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m6 17 5-5-5-5" />
                                  <path d="m13 17 5-5-5-5" />
                                </svg>
                                <span className="meme-advanced-order-input-label">
                                  Sell Amount on Migration
                                </span>
                                <input
                                  type="number"
                                  className="meme-advanced-order-input"
                                  value={order.percentage || ''}
                                  onChange={(e) =>
                                    handleAdvancedOrderUpdate(
                                      order.id,
                                      'percentage',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0"
                                />
                                <span className="meme-advanced-order-unit">
                                  %
                                </span>
                              </div>
                              <button
                                className="meme-advanced-order-remove"
                                onClick={() =>
                                  handleAdvancedOrderRemove(order.id)
                                }
                              >
                                <img
                                  src={trash}
                                  className="meme-advanced-order-remove-icon"
                                  alt="Remove"
                                  width="14"
                                  height="14"
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {advancedOrders.length < 5 && (
                      <div className="meme-advanced-add-container">
                        <Tooltip content="Advanced Orders are coming soon!">
                          <button
                            className="meme-advanced-add-button"
                          // onClick={() =>
                          //   setShowAdvancedDropdown(!showAdvancedDropdown)
                          // }
                          >
                            <span>Add</span>
                            <svg
                              className="meme-advanced-add-icon"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path
                                d="M8 3v10M3 8h10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </Tooltip>
                        {showAdvancedDropdown && (
                          <div className="meme-advanced-dropdown">
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() =>
                                handleAdvancedOrderAdd('takeProfit')
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(154 155 164)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m5 12 7-7 7 7" />
                                <path d="M12 19V5" />
                              </svg>
                              Take Profit
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('stopLoss')}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(154 155 164)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 5v14" />
                                <path d="m19 12-7 7-7-7" />
                              </svg>
                              Stop Loss
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('devSell')}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(154 155 164)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 17V3" />
                                <path d="m6 11 6 6 6-6" />
                                <path d="M19 21H5" />
                              </svg>
                              Sell on Dev Sell
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() =>
                                handleAdvancedOrderAdd('migration')
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(154 155 164)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m6 17 5-5-5-5" />
                                <path d="m13 17 5-5-5-5" />
                              </svg>
                              Migration
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!account.connected) {
                setpopup(4);
              } else {
                const targetChainId =
                  settings.chainConfig[activechain]?.chainId || activechain;
                if (account.chainId !== targetChainId) {
                  walletPopup.showChainSwitchRequired(
                    settings.chainConfig[activechain]?.name || 'Monad',
                  );
                  setChain();
                } else {
                  handleTrade(tradeAmount);
                }
              }
            }}
            className={`meme-trade-action-button ${activeTradeType}`}
            disabled={isTradeDisabled()}
          >
            {isSigning ? (
              <div className="meme-button-spinner"></div>
            ) : (
              getButtonText()
            )}
          </button>
          <div
            className="meme-portfolio-stats"
            onClick={handleToggleCurrency}
            style={{ cursor: 'pointer' }}
          >
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Bought</div>
              <div className="meme-portfolio-value bought">
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
                      className="meme-mobile-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(userStats.valueBought, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Sold</div>
              <div className="meme-portfolio-value sold">
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
                      className="meme-mobile-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(userStats.valueSold, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Holding</div>
              <div className="meme-portfolio-value holding">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(
                      userStats.balance * currentPrice * monUsdPrice,
                      3,
                    )}
                  </>
                ) : (
                  <>
                    <img
                      className="meme-mobile-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(
                      userStats.balance * currentPrice,
                      3,
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat pnl">
              <div className="meme-portfolio-label">PnL</div>
              <div
                className={`meme-portfolio-value pnl ${userStats.valueNet >= 0 ? 'positive' : 'negative'}`}
              >
                {showUSD ? (
                  <>
                    {userStats.valueNet >= 0 ? '+' : '-'}
                    <span>$</span>
                    {formatNumberWithCommas(
                      Math.abs(userStats.valueNet * monUsdPrice),
                      1,
                    )}
                  </>
                ) : (
                  <>
                    <img className="meme-mobile-monad-icon" src={monadicon} />
                    {userStats.valueNet >= 0 ? '+' : '-'}
                    {formatNumberWithCommas(Math.abs(userStats.valueNet), 1)}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="meme-trade-settings">
            <div className="meme-settings-presets">
              <button
                className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 1 ? 'active' : ''}`}
                onClick={() => {
                  if (
                    settingsExpanded &&
                    (settingsMode === 'buy'
                      ? selectedBuyPreset
                      : selectedSellPreset) === 1
                  ) {
                    setSettingsExpanded(false);
                  } else {
                    handlePresetSelect(1);
                    setSettingsExpanded(true);
                  }
                }}
              >
                PRESET 1
              </button>
              <button
                className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 2 ? 'active' : ''}`}
                onClick={() => {
                  if (
                    settingsExpanded &&
                    (settingsMode === 'buy'
                      ? selectedBuyPreset
                      : selectedSellPreset) === 2
                  ) {
                    setSettingsExpanded(false);
                  } else {
                    handlePresetSelect(2);
                    setSettingsExpanded(true);
                  }
                }}
              >
                PRESET 2
              </button>
              <button
                className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 3 ? 'active' : ''}`}
                onClick={() => {
                  if (
                    settingsExpanded &&
                    (settingsMode === 'buy'
                      ? selectedBuyPreset
                      : selectedSellPreset) === 3
                  ) {
                    setSettingsExpanded(false);
                  } else {
                    handlePresetSelect(3);
                    setSettingsExpanded(true);
                  }
                }}
              >
                PRESET 3
              </button>
            </div>

            {settingsExpanded && (
              <div className="meme-settings-content">
                <div className="meme-settings-mode-toggle">
                  <button
                    className={`meme-settings-mode-btn ${settingsMode === 'buy' ? 'active' : ''}`}
                    onClick={() => setSettingsMode('buy')}
                  >
                    Buy settings
                  </button>
                  <button
                    className={`meme-settings-mode-btn ${settingsMode === 'sell' ? 'active' : ''}`}
                    onClick={() => setSettingsMode('sell')}
                  >
                    Sell settings
                  </button>
                </div>
                <div className="meme-settings-grid">
                  <div className="meme-setting-item">
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="decimal"
                        className="meme-setting-input"
                        value={
                          settingsMode === 'buy'
                            ? buySlippageValue
                            : sellSlippageValue
                        }
                        onChange={(e) =>
                          settingsMode === 'buy'
                            ? setBuySlippageValue(e.target.value)
                            : setSellSlippageValue(e.target.value)
                        }
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <span className="meme-setting-unit">%</span>
                    </div>
                    <label className="meme-setting-label">
                      <img
                        src={slippage}
                        alt="Slippage"
                        className="meme-setting-label-icon-slippage"
                      />
                      SLIPPAGE
                    </label>
                  </div>

                  <div className="meme-setting-item">
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="decimal"
                        className="meme-setting-input"
                        value={
                          settingsMode === 'buy'
                            ? buyPriorityFee
                            : sellPriorityFee
                        }
                        onChange={(e) =>
                          settingsMode === 'buy'
                            ? setBuyPriorityFee(e.target.value)
                            : setSellPriorityFee(e.target.value)
                        }
                        step="0.001"
                        min="0"
                      />
                      <span className="meme-setting-unit">GWEI</span>
                    </div>
                    <label className="meme-setting-label">
                      <img
                        src={gas}
                        alt="Priority Fee"
                        className="meme-setting-label-icon"
                      />
                      PRIORITY
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="meme-token-info-container">
          <div className="meme-token-info-header">
            <h3 className="meme-token-info-title">Token Info</h3>
            <button
              className="meme-token-info-collapse-button"
              onClick={() => setTokenInfoExpanded(!tokenInfoExpanded)}
            >
              <svg
                className={`meme-token-info-arrow ${tokenInfoExpanded ? 'expanded' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          {tokenInfoExpanded && (
            <div>
              <div className="meme-token-info-grid">
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        top10HoldingPercentage > 50
                          ? '#eb7070ff'
                          : top10HoldingPercentage > 30
                            ? '#eb7070ff'
                            : 'rgb(67 254 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          top10HoldingPercentage > 50
                            ? '#eb7070ff'
                            : top10HoldingPercentage > 30
                              ? '#eb7070ff'
                              : 'rgb(67 254 154)',
                      }}
                    >
                      {top10HoldingPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Top 10 H.</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        token.devHolding > 50
                          ? '#eb7070ff'
                          : token.devHolding > 30
                            ? '#eb7070ff'
                            : 'rgb(67 254 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.devHolding > 50
                            ? '#eb7070ff'
                            : token.devHolding > 30
                              ? '#eb7070ff'
                              : 'rgb(67 254 154)',
                      }}
                    >
                      {token.devHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Dev H.</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="sniper-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={
                        token.sniperHolding > 5
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.sniperHolding > 50
                            ? '#eb7070ff'
                            : token.sniperHolding > 30
                              ? '#eb7070ff'
                              : 'rgb(67 254 154)',
                      }}
                    >
                      {token.sniperHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Sniper H.</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        token.insiderHolding > 50
                          ? '#eb7070ff'
                          : token.insiderHolding > 30
                            ? '#eb7070ff'
                            : 'rgb(67 254 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.insiderHolding > 50
                            ? '#eb7070ff'
                            : token.insiderHolding > 30
                              ? '#eb7070ff'
                              : 'rgb(67 254 154)',
                      }}
                    >
                      {token.insiderHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Insiders</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-interface-traders-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="#ced0df"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color: '#ced0df',
                      }}
                    >
                      {holders.length}
                    </span>
                  </div>
                  <span className="meme-token-info-label">Holders</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#ced0df"
                      xmlns="http://www.w3.org/2000/svg"
                      className="meme-interface-traders-icon"
                    >
                      <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color: '#ced0df',
                      }}
                    >
                      {token.proTraders}
                    </span>
                  </div>
                  <span className="meme-token-info-label">Pro Traders</span>
                </div>
              </div>
              <div className="meme-token-info-footer">
                <span className="meme-address">
                  <div className="address-top">
                    <div
                      className="meme-address-content"
                      onClick={() =>
                        copyToClipboard(token.id, 'Contract address copied')
                      }
                    >
                      <Tooltip content="Copy contract address">
                        <img className="meme-contract-icon" src={contract} />
                        <span className="meme-address-title">CA:</span>{' '}
                        <span className="meme-explorer-link">
                          {token.id.slice(0, 15)}...{token.id.slice(-4)}
                        </span>
                      </Tooltip>
                    </div>
                    <Tooltip content="View on Monad Explorer">
                      <svg
                        className="meme-address-link"
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        onClick={() => openInExplorer(token.id)}
                      >
                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                        <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                      </svg>
                    </Tooltip>
                  </div>
                </span>
                <span className="meme-address">
                  <div className="address-top">
                    <div
                      className="meme-address-content"
                      onClick={() =>
                        copyToClipboard(token.dev, 'Dev address copied')
                      }
                    >
                      <Tooltip content="Copy developer address">
                        <img className="meme-contract-icon" src={contract} />
                        <span className="meme-address-title">DA:</span>{' '}
                        <span className="meme-explorer-link">
                          {token.dev.slice(0, 15)}...{token.dev.slice(-4)}
                        </span>
                      </Tooltip>
                    </div>
                    <Tooltip content="View on Monad Explorer">
                      <svg
                        className="meme-address-link"
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        onClick={() => openInExplorer(token.dev)}
                      >
                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                        <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                      </svg>
                    </Tooltip>
                  </div>
                  <div className="dev-address-bottom">
                    <div className="dev-address-bottom-left">
                      <Tooltip content="View funding wallet on Monad Explorer">
                        <div
                          className="funding-location"
                          onClick={() =>
                            window.open(
                              `${settings.chainConfig[activechain].explorer}/address/${token.dev}`,
                              '_blank',
                            )
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="funding-by-wallet-icon"
                          >
                            <path d="m5 12 7-7 7 7" />
                            <path d="M12 19V5" />
                          </svg>
                          {token.id.slice(0, 6)}...{token.id.slice(-4)}
                        </div>
                      </Tooltip>
                      <Tooltip content={`$${(4.0 * monUsdPrice).toFixed(2)}`}>
                        <div className="funding-amount">
                          <img
                            src={monadicon}
                            className="meme-mobile-monad-icon"
                          />{' '}
                          4.00
                        </div>
                      </Tooltip>
                    </div>
                    <div className="funding-time-ago">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="funding-time-ago-icon"
                      >
                        <path d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span>3 mo</span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="meme-similar-tokens-container">
          <div className="meme-token-info-header">
            <h3 className="meme-token-info-title">Similar Tokens</h3>
            <button
              className="meme-token-info-collapse-button"
              onClick={() => setSimilarTokensExpanded((v) => !v)}
            >
              <svg
                className={`meme-token-info-arrow ${similarTokensExpanded ? 'expanded' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          {similarTokensExpanded &&
            (Array.isArray(similarTokens) && similarTokens.length > 0 ? (
              <ul className="meme-similar-token-list">
                {similarTokens.map((t) => {
                  const mcap =
                    typeof t.marketCap === 'number'
                      ? t.marketCap
                      : Number(t.marketCap || 0);
                  const vol =
                    typeof t.volume24h === 'number'
                      ? t.volume24h
                      : Number(t.volume24h || 0);
                  const img =
                    t.imageUrl && t.imageUrl.length > 0 ? t.imageUrl : '';

                  return (
                    <li
                      key={String(t.id)}
                      className="meme-similar-token-row"
                      onClick={() => navigate(`/meme/${t.id}`)}
                    >
                      <div className="meme-similar-token-left">
                        <div
                          className="meme-similar-token-avatar"
                          ref={(el) => {
                            if (el) {
                              similarTokenImageRefs.current.set(
                                String(t.id),
                                el,
                              );
                            } else {
                              similarTokenImageRefs.current.delete(
                                String(t.id),
                              );
                            }
                          }}
                          onMouseEnter={() =>
                            img && setHoveredSimilarTokenImage(String(t.id))
                          }
                          onMouseLeave={() => setHoveredSimilarTokenImage(null)}
                          style={{ cursor: img ? 'pointer' : 'default' }}
                        >
                          {img && !tokenImageErrors[t.id] ? (
                            <img
                              src={img}
                              alt={`${t.symbol || t.name} logo`}
                              onError={() => {
                                setTokenImageErrors(prev => ({ ...prev, [t.id]: true }));
                              }}
                            />
                          ) : (
                            <div className="meme-similar-token-avatar-fallback" style={{
                              backgroundColor: 'rgba(35, 34, 41, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: (t.symbol || '').length <= 2 ? '14px' : '14px',
                              fontWeight: '200',
                              color: '#ffffff',
                              borderRadius: '3px',
                              letterSpacing: (t.symbol || '').length > 2 ? '-0.5px' : '0',
                              width: '43px',
                              height: '43px',
                            }}>
                              {(t.symbol || t.name || '?')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}

                        </div>

                        <div className="meme-similar-token-meta">
                          <div className="meme-similar-token-title">
                            <span className="meme-similar-token-name">
                              {t.name || 'Token'}
                            </span>
                            <span className="meme-similar-token-symbol">
                              {t.symbol || 'TKN'}
                            </span>
                          </div>
                          <div className="meme-similar-token-id">
                            <span>Last TX: </span>
                            {(() => {
                              const tsSec = Number(t.lastUpdatedAt);
                              const nowSec = Math.floor(Date.now() / 1000);
                              const diffSec = Math.max(
                                0,
                                nowSec - Math.floor(tsSec),
                              );

                              if (diffSec < 60) return `${diffSec}s`;

                              const m = Math.floor(diffSec / 60);
                              if (m < 60) return `${m}m`;

                              const h = Math.floor(m / 60);
                              if (h < 24) return `${h}h`;

                              const d = Math.floor(h / 24);
                              return `${d}d`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="meme-similar-token-right">
                        <div className="meme-similar-token-stat">
                          <span className="label">MC</span>
                          <span className="value">{formatNumberWithCommas(mcap)}</span>
                        </div>
                        <div className="meme-similar-token-stat">
                          <span className="label">24h Vol.</span>
                          <span className="value">{formatNumberWithCommas(vol)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="meme-similar-token-empty">No similar tokens</div>
            ))}
        </div>
      </div>

      <div className="meme-mobile-quickbuy mobile-only">
        <div className="meme-mobile-header">
          <div className="meme-mobile-trade-toggle">
            <button
              className={`meme-mobile-trade-btn ${mobileTradeType === 'buy' ? 'active buy' : ''}`}
              onClick={() => setMobileTradeType('buy')}
            >
              Buy
            </button>
            <button
              className={`meme-mobile-trade-btn ${mobileTradeType === 'sell' ? 'active sell' : ''}`}
              onClick={() => setMobileTradeType('sell')}
            >
              Sell
            </button>
          </div>

          <div className="meme-mobile-controls">
            <button
              className={`meme-mobile-wallets-button ${isWalletDropdownOpen ? 'active' : ''}`}
              onClick={() => {
                if (!address) {
                  setpopup(4);
                } else {
                  setIsWalletDropdownOpen(!isWalletDropdownOpen);
                }
              }}
              title="Toggle Wallets"
            >
              <img
                src={walleticon}
                alt="Wallet"
                className="meme-mobile-wallets-icon"
              />
              <span className="meme-mobile-wallets-count">
                {subWallets.length}
              </span>
            </button>
          </div>
        </div>

        {mobileTradeType === 'buy' ? (
          <div className="meme-mobile-buy-section">
            <div className="meme-mobile-section-header">
              <div className="meme-mobile-preset-controls">
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 1 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(1)}
                >
                  P1
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 2 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(2)}
                >
                  P2
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 3 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(3)}
                >
                  P3
                </button>
              </div>
              <div className="meme-mobile-order-indicator">
                <img
                  className="meme-mobile-monad-icon"
                  src={monadicon}
                  alt="MON"
                />
                0
              </div>
            </div>

            <div className="meme-mobile-amount-buttons">
              {mobileBuyAmounts.map((amount, index) => (
                <button
                  key={index}
                  className={`meme-mobile-amount-btn ${mobileSelectedBuyAmount === amount ? 'active' : ''}`}
                  onClick={() => {
                    setMobileSelectedBuyAmount(amount);
                    handleMobileTrade(amount, 'buy');
                  }}
                  disabled={!account?.connected}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="meme-mobile-sell-section">
            <div className="meme-mobile-section-header">
              <div className="meme-mobile-preset-controls">
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 1 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(1)}
                >
                  P1
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 2 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(2)}
                >
                  P2
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 3 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(3)}
                >
                  P3
                </button>
              </div>
              <div className="meme-mobile-order-indicator">
                <img
                  className="meme-mobile-monad-icon"
                  src={monadicon}
                  alt="MON"
                />
                0
              </div>
            </div>

            <div className="meme-mobile-percent-buttons">
              {mobileSellPercents.map((percent, index) => (
                <button
                  key={index}
                  className={`meme-mobile-percent-btn ${mobileSelectedSellPercent === percent ? 'active' : ''}`}
                  onClick={() => {
                    setMobileSelectedSellPercent(percent);
                    handleMobileTrade(percent, 'sell');
                  }}
                  disabled={
                    !account?.connected ||
                    walletTokenBalances?.[userAddr]?.[token.id] <= 0
                  }
                >
                  {percent}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="meme-mobile-settings-display">
          <div className="meme-mobile-settings-item">
            <img
              src={slippage}
              alt="Slippage"
              className="meme-mobile-settings-icon"
            />
            <span className="meme-mobile-settings-value">
              {mobileTradeType === 'buy' ? buySlippageValue : sellSlippageValue}
              %
            </span>
          </div>
          <div className="meme-mobile-settings-item">
            <img
              src={gas}
              alt="Priority Fee"
              className="meme-mobile-settings-icon"
            />
            <span className="meme-mobile-settings-value">
              {mobileTradeType === 'buy' ? buyPriorityFee : sellPriorityFee}
            </span>
          </div>
        </div>

        {isWalletDropdownOpen && window.innerWidth < 1020 && (
          <div className="meme-mobile-wallets-panel" ref={walletDropdownPanelRef}>
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
                  <div className="meme-wallet-dropdown-header">
                    <div className="meme-wallet-dropdown-actions">
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
                              className="meme-wallet-action-btn select-all"
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
                                className="meme-wallet-merge-btn consolidate"
                                onClick={handleConsolidateTokens}
                                disabled={
                                  !hasExactlyOneSelected ||
                                  !hasSourceWallets ||
                                  isConsolidating
                                }
                              >
                                <img src={merge} className="merge-icon" alt="Consolidate" />
                                Consolidate
                              </button>
                            </Tooltip>
                            <Tooltip content="Split tokens across selected wallets with 20% variance">
                              <button
                                className="meme-wallet-merge-btn split"
                                onClick={handleSplitTokens}
                                disabled={selectedWallets.size < 2 || isSplitting}
                              >
                                <img src={merge} className="merge-icon" alt="Split" />
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
                              className="meme-wallet-action-btn select-all"
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
                              className="meme-wallet-action-btn select-all"
                              onClick={selectAllWithBalance}
                            >
                              Select All With Balance
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                    <button
                      className="meme-wallet-dropdown-close"
                      onClick={() => setIsWalletDropdownOpen(false)}
                    >
                      <img
                        src={closebutton}
                        className="meme-wallet-dropdown-close-icon"
                        alt="Close"
                      />
                    </button>
                  </div>

                  <div className="meme-wallet-dropdown-list">
                    <>
                      {walletsWithToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isSelected = selectedWallets.has(wallet.address);
                        const tokenBalance = getWalletTokenBalance(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);

                        return (
                          <div
                            key={wallet.address}
                            className={`meme-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleWalletSelection(wallet.address)}
                          >
                            <div className="meme-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="meme-wallet-checkbox"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div className="meme-wallet-info">
                              <div className="meme-wallet-name">
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
                                className="meme-wallet-address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.address, 'Wallet address copied');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {wallet.address.slice(0, 4)}...
                                {wallet.address.slice(-4)}
                                <svg
                                  className="meme-wallet-address-copy-icon"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                </svg>
                              </div>
                            </div>

                            <div className="meme-wallet-balance">
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  settings.chainConfig[activechain]?.eth
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`meme-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="meme-wallet-mon-icon"
                                        alt="MON"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>

                            <div className="meme-wallet-tokens">
                              {tokenBalance > 0 ? (
                                <Tooltip content="Tokens">
                                  <div
                                    className={`meme-wallet-token-amount ${isBlurred ? 'blurred' : ''}`}
                                  >
                                    {token.image && (
                                      <img
                                        src={token.image}
                                        className="meme-wallet-token-icon"
                                        alt={token.symbol}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="meme-wallet-token-balance">
                                      {formatNumberWithCommas(tokenBalance, 2)}
                                    </span>
                                  </div>
                                </Tooltip>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                      {hasTokenHolders && walletsWithoutToken.length > 0 && (
                        <div className="meme-wallets-section-label">
                          <button
                            className="meme-wallet-action-btn"
                            onClick={() => {
                              if (allWithoutSelected) {
                                setSelectedWallets((prev) => {
                                  const next = new Set(prev);
                                  walletsWithoutTokenAddrs.forEach((a) => next.delete(a));
                                  return next;
                                });
                              } else {
                                setSelectedWallets((prev) => {
                                  const next = new Set(prev);
                                  walletsWithoutTokenAddrs.forEach((a) => next.add(a));
                                  return next;
                                });
                              }
                            }}
                          >
                            {allWithoutSelected ? 'Unselect All' : 'Select All'}
                          </button>

                          <button
                            className="meme-wallet-action-btn"
                            onClick={selectAllWithBalanceWithoutToken}
                          >
                            Select All With Balance
                          </button>
                        </div>
                      )}

                      {walletsWithoutToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isSelected = selectedWallets.has(wallet.address);
                        const tokenCount = getWalletTokenCount(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);

                        return (
                          <div
                            key={wallet.address}
                            className={`meme-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleWalletSelection(wallet.address)}
                          >
                            <div className="meme-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="meme-wallet-checkbox"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div className="meme-wallet-info">
                              <div className="meme-wallet-name">
                                {getWalletName(
                                  wallet.address,
                                  index + walletsWithToken.length,
                                )}
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
                                className="meme-wallet-address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.address, 'Wallet address copied');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {wallet.address.slice(0, 4)}...
                                {wallet.address.slice(-4)}
                                <svg
                                  className="meme-wallet-address-copy-icon"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                </svg>
                              </div>
                            </div>

                            <div className="meme-wallet-balance">
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  settings.chainConfig[activechain]?.eth
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`meme-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="meme-wallet-mon-icon"
                                        alt="MON"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>

                            <div className="meme-wallet-tokens">
                              <Tooltip content="Tokens">
                                <div className="meme-wallet-token-count">
                                  <div className="meme-wallet-token-structure-icons">
                                    <div className="token1"></div>
                                    <div className="token2"></div>
                                    <div className="token3"></div>
                                  </div>
                                  <span className="meme-wallet-total-tokens">
                                    {tokenCount}
                                  </span>
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}

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
                    </>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
      <QuickBuyWidget
        isOpen={isWidgetOpen}
        onClose={() => {
          localStorage.setItem(
            'crystal_quickbuy_widget_open',
            JSON.stringify(false),
          );
          setIsWidgetOpen(false);
        }}
        token={token}
        tokenPrice={currentPrice}
        buySlippageValue={buySlippageValue}
        buyPriorityFee={buyPriorityFee}
        sellSlippageValue={sellSlippageValue}
        sellPriorityFee={sellPriorityFee}
        sendUserOperationAsync={sendUserOperationAsync}
        account={account}
        setChain={setChain}
        activechain={activechain}
        routerAddress={routerAddress}
        setpopup={setpopup}
        subWallets={subWallets}
        walletTokenBalances={walletTokenBalances}
        activeWalletPrivateKey={activeWalletPrivateKey}
        tokenList={tokenList}
        isBlurred={isBlurred}
        terminalRefetch={terminalRefetch}
        userStats={userStats}
        monUsdPrice={monUsdPrice}
        showUSD={showUSD}
        onToggleCurrency={handleToggleCurrency}
        nonces={nonces}
        selectedWallets={selectedWallets}
        setSelectedWallets={setSelectedWallets}
        isTerminalDataFetching={isTerminalDataFetching}
        createSubWallet={createSubWallet}
        setOneCTDepositAddress={setOneCTDepositAddress}
        signTypedDataAsync={signTypedDataAsync}
        transactionSounds={transactionSounds}
        buySound={buySound}
        sellSound={sellSound}
        volume={volume}
      />

      {hoveredSimilarTokenImage &&
        showSimilarTokenPreview &&
        createPortal(
          <div
            className="explorer-image-preview show"
            style={{
              position: 'absolute',
              top: `${similarTokenPreviewPosition.top}px`,
              left: `${similarTokenPreviewPosition.left}px`,
              zIndex: 9999,
              pointerEvents: 'none',
              opacity: 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div className="explorer-preview-content">
              {(() => {
                const token = similarTokens.find(
                  (t: any) => String(t.id) === hoveredSimilarTokenImage,
                );
                const imageUrl = token?.imageUrl || '';
                const hasError = tokenImageErrors[hoveredSimilarTokenImage];

                return imageUrl && !hasError ? (
                  <img
                    src={imageUrl}
                    alt="Token preview"
                    style={{
                      width: '220px',
                      height: '220px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '220px',
                      height: '220px',
                      borderRadius: '6px',
                      backgroundColor: 'rgb(6,6,6)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(179, 184, 249, 0.15)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: (token?.symbol || '').length <= 3 ? '72px' : '56px',
                        fontWeight: '200',
                        color: '#ffffff',
                        letterSpacing: (token?.symbol || '').length > 3 ? '-4px' : '0',
                        marginBottom: '8px',
                      }}
                    >
                      {(token?.symbol || token?.name || '?').slice(0, 3).toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '300',
                        color: 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {token?.name || 'Token'}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body,
        )}

    </div>
  );
};

export default MemeInterface; 