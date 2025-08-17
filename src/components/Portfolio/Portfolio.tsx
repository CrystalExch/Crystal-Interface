import { Eye, Search, Eye as EyeIcon, Edit2, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import PortfolioGraph from './PortfolioGraph/PortfolioGraph';
import OrderCenter from '../OrderCenter/OrderCenter';
import ReferralSidebar from './ReferralSidebar/ReferralSidebar';
import cheveron from '../../assets/chevron_arrow.png'
import { useSharedContext } from '../../contexts/SharedContext';
import { formatCommas } from '../../utils/numberDisplayFormat';
import { settings } from '../../settings';
import './Portfolio.css';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import key from '../../assets/key.svg';
import trash from '../../assets/trash.svg';
import { createPortal } from 'react-dom';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import './Portfolio.css'

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const [vis, setVis] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 25;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 25;
        break;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  useEffect(() => {
    if (vis) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [vis, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis && createPortal(
        <div
          className={`tooltip tooltip-${position} fade-popup visible`}
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: position === 'top' || position === 'bottom'
              ? 'translateX(-50%)'
              : position === 'left' || position === 'right'
                ? 'translateY(-50%)'
                : 'none',
            zIndex: 9999,
            pointerEvents: 'none'
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
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: string;
  direction: SortDirection;
}

interface TokenType {
  address: string;
  symbol: string;
  decimals: bigint;
  name: string;
  ticker: string;
  image: string;
}

interface TradesByMarket {
  [key: string]: any[];
}

interface WalletDragItem {
  address: string;
  name: string;
  balance: number;
  totalValue: number;
  index: number;
  sourceZone?: 'source' | 'destination';
}
interface PortfolioProps {
  orders: any[];
  tradehistory: any[];
  trades: TradesByMarket;
  canceledorders: any[];
  tokenList: TokenType[];
  router: any;
  address: string;
  isBlurred: any;
  setIsBlurred: any;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  tokenBalances: any;
  totalAccountValue: number | null;
  setTotalVolume: (volume: number) => void;
  totalVolume: number;
  chartData: any[];
  portChartLoading: boolean;
  chartDays: number;
  setChartDays: (days: number) => void;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number };
  refLink: string;
  setRefLink: any;
  setShowRefModal: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  waitForTxReceipt: any;
  marketsData: any;
  usedRefLink: string;
  setUsedRefLink: any;
  usedRefAddress: string;
  setUsedRefAddress: any;
  client: any;
  activechain: any;
  markets: any;
  isSpectating?: boolean;
  spectatedAddress?: string;
  onStartSpectating?: (address: string) => void;
  onStopSpectating?: () => void;
  originalAddress?: string;
  onSpectatingChange?: (isSpectating: boolean, address: string | null) => void;
  subWallets: Array<{ address: string, privateKey: string }>;
  setSubWallets: (wallets: Array<{ address: string, privateKey: string }>) => void;
  walletTokenBalances: { [address: string]: any };
  walletTotalValues: { [address: string]: number };
  walletsLoading: boolean;
  subwalletBalanceLoading: { [address: string]: boolean };
  refreshWalletBalance: (address: string) => void;
  forceRefreshAllWallets: () => void;
  setOneCTSigner: (privateKey: string) => void;
  isVaultDepositSigning: boolean;
  setIsVaultDepositSigning: (signing: boolean) => void;
  handleSetChain: () => Promise<void>;
  handleSubwalletTransfer: (fromAddress: string, toAddress: string, amount: string, fromPrivateKey: string) => Promise<void>;
  createSubWallet?: () => Promise<void>;
  signTypedDataAsync?: any;
  keccak256?: any;
  Wallet?: any;
  activeWalletPrivateKey?: string;

}

type PortfolioTab = 'spot' | 'margin' | 'wallets' | 'trenches';

const Portfolio: React.FC<PortfolioProps> = ({
  orders,
  tradehistory,
  trades,
  canceledorders,
  tokenList,
  router,
  address,
  isBlurred,
  setIsBlurred,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  tokenBalances,
  totalAccountValue,
  setTotalVolume,
  totalVolume,
  chartData,
  portChartLoading,
  chartDays,
  setChartDays,
  totalClaimableFees,
  claimableFees,
  refLink,
  setRefLink,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  account,
  refetch,
  sendUserOperationAsync,
  setChain,
  waitForTxReceipt,
  marketsData,
  usedRefLink,
  setUsedRefLink,
  usedRefAddress,
  setUsedRefAddress,
  client,
  activechain,
  markets,
  isSpectating: propIsSpectating,
  spectatedAddress: propSpectatedAddress,
  onStartSpectating,
  onStopSpectating,
  originalAddress,
  onSpectatingChange,
  subWallets,
  setSubWallets,
  walletTokenBalances,
  walletTotalValues,
  walletsLoading,
  refreshWalletBalance,
  setOneCTSigner,
  isVaultDepositSigning,
  setIsVaultDepositSigning,
  handleSetChain,
  handleSubwalletTransfer,
  signTypedDataAsync,
  keccak256,
  Wallet,
  activeWalletPrivateKey
}) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('spot');
  const [activeSection, setActiveSection] = useState<
    'orders' | 'tradeHistory' | 'orderHistory' | 'balances'
  >('balances');
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'balance',
    direction: 'desc',
  });

  const [enabledWallets, setEnabledWallets] = useState<Set<string>>(new Set());
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>({});
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const [draggedWallet, setDraggedWallet] = useState<WalletDragItem | null>(null);
  const [sourceWallets, setSourceWallets] = useState<WalletDragItem[]>([]);
  const [destinationWallets, setDestinationWallets] = useState<WalletDragItem[]>([]);
  const [dragOverZone, setDragOverZone] = useState<'source' | 'destination' | 'main' | null>(null);

  const [distributionAmount, setDistributionAmount] = useState<string>('');
  const [distributionMode, setDistributionMode] = useState<'equal' | 'proportional'>('equal');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositTargetWallet, setDepositTargetWallet] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const mainWalletsRef = useRef<HTMLDivElement>(null);
  const sourceWalletsRef = useRef<HTMLDivElement>(null);
  const destinationWalletsRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingWallet, setExportingWallet] = useState<{ address: string, privateKey: string } | null>(null);
  const [previewSelection, setPreviewSelection] = useState<Set<string>>(new Set());

  const showDistributionSuccess = useCallback((amount: string, sourceCount: number, destCount: number) => {
    const txId = `distribution-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Distribution Complete',
        subtitle: `Distributed ${amount} MON across ${destCount} wallets from ${sourceCount} sources`,
        amount: amount,
        amountUnit: 'MON'
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Distribution Complete',
        subtitle: `Distributed ${amount} MON across ${destCount} wallets from ${sourceCount} sources`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);

  const showDepositSuccess = useCallback((amount: string, targetWallet: string) => {
    const txId = `deposit-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Deposit Complete',
        subtitle: `Deposited ${amount} MON to ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`,
        amount: amount,
        amountUnit: 'MON'
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Deposit Complete',
        subtitle: `Deposited ${amount} MON to ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);

  const showWalletCreated = useCallback(() => {
    const txId = `wallet-created-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Subwallet Created',
        subtitle: 'New subwallet has been successfully created'
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Subwallet Created',
        subtitle: 'New subwallet has been successfully created',
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);

  const showWalletImported = useCallback((walletAddress: string) => {
    const txId = `wallet-imported-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Wallet Imported',
        subtitle: `Successfully imported ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Wallet Imported',
        subtitle: `Successfully imported ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);

  const showSendBackSuccess = useCallback((walletCount: number) => {
    const txId = `send-back-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Send Back Complete',
        subtitle: `Successfully sent funds back from ${walletCount} wallets to main wallet`
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Send Back Complete',
        subtitle: `Successfully sent funds back from ${walletCount} wallets to main wallet`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 1020);
    if (window.innerHeight > 1080) {
      setOrderCenterHeight(363.58);
    } else if (window.innerHeight > 960) {
      setOrderCenterHeight(322.38);
    } else if (window.innerHeight > 840) {
      setOrderCenterHeight(281.18);
    } else if (window.innerHeight > 720) {
      setOrderCenterHeight(239.98);
    } else {
      setOrderCenterHeight(198.78);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { high, low, days, percentage, timeRange, setPercentage } =
    useSharedContext();

  const activeOrders = orders.length;
  const [orderCenterHeight, setOrderCenterHeight] = useState(() => {
    if (window.innerHeight > 1080) return 363.58;
    if (window.innerHeight > 960) return 322.38;
    if (window.innerHeight > 840) return 281.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1020);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string>('');
  const isWalletActive = (walletPrivateKey: string) => {
    return activeWalletPrivateKey === walletPrivateKey;
  };
  const deleteWallet = (address: string) => {
    const walletToDelete = subWallets.find(w => w.address === address);

    if (walletToDelete && isWalletActive(walletToDelete.privateKey)) {
      localStorage.removeItem('crystal_active_wallet_private_key');
      console.log('Cleared active wallet from localStorage - wallet being deleted');
    }

    const updatedWallets = subWallets.filter(w => w.address !== address);
    setSubWallets(updatedWallets);
    saveSubWalletsToStorage(updatedWallets);

    const newEnabledWallets = new Set(enabledWallets);
    newEnabledWallets.delete(address);
    setEnabledWallets(newEnabledWallets);
    localStorage.setItem('crystal_enabled_wallets', JSON.stringify(Array.from(newEnabledWallets)));

    const newWalletNames = { ...walletNames };
    delete newWalletNames[address];
    setWalletNames(newWalletNames);
    localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));

    setShowDeleteConfirmation(false);
    setWalletToDelete('');
    closeExportModal();
  };

  const confirmDeleteWallet = (address: string) => {
    setWalletToDelete(address);
    setShowDeleteConfirmation(true);
  };
  const [internalIsSpectating, setInternalIsSpectating] = useState(false);
  const [internalSpectatedAddress, setInternalSpectatedAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const isSpectating = propIsSpectating !== undefined ? propIsSpectating : internalIsSpectating;
  const spectatedAddress = propSpectatedAddress !== undefined ? propSpectatedAddress : internalSpectatedAddress;

  const getActiveAddress = () => {
    return isSpectating ? spectatedAddress : address;
  };
  const getMainWalletBalance = () => {
    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);

    if (ethToken && tokenBalances[ethToken.address]) {
      return Number(tokenBalances[ethToken.address]) / 10 ** Number(ethToken.decimals);
    }
    return 0;
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const isValidPrivateKey = (key: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(key) || /^[a-fA-F0-9]{64}$/.test(key);
  };

  useEffect(() => {
    const storedEnabledWallets = localStorage.getItem('crystal_enabled_wallets');
    if (storedEnabledWallets) {
      try {
        setEnabledWallets(new Set(JSON.parse(storedEnabledWallets)));
      } catch (error) {
        console.error('Error loading enabled wallets:', error);
      }
    }

    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }
  }, []);

  const saveSubWalletsToStorage = (wallets: Array<{ address: string, privateKey: string }>) => {
    localStorage.setItem('crystal_sub_wallets', JSON.stringify(wallets));
  };


  const handleDragStartFromZone = (e: React.DragEvent, wallet: WalletDragItem, zone: 'source' | 'destination') => {
    setDraggedWallet({ ...wallet, sourceZone: zone });
    e.dataTransfer.effectAllowed = 'move';

    const dragData = { ...wallet, sourceZone: zone, type: 'single-zone-drag' };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };
  const handleDragStart = (e: React.DragEvent, wallet: { address: string, privateKey: string }, index: number) => {
    e.stopPropagation();
    const dragData: WalletDragItem & { type: string } = {
      address: wallet.address,
      name: getWalletName(wallet.address, index),
      balance: getWalletBalance(wallet.address),
      totalValue: getTotalWalletValue(wallet.address),
      index,
      type: 'single-main-drag'
    };

    setDraggedWallet(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };
  const handleSingleMainDrop = (dragData: any, targetZone: 'source' | 'destination') => {
    console.log('Single main drop:', dragData.address, 'to', targetZone);

    const targetArray = targetZone === 'source' ? sourceWallets : destinationWallets;
    const isAlreadyInZone = targetArray.some(w => w.address === dragData.address);

    if (isAlreadyInZone) return;

    if (targetZone === 'source') {
      setSourceWallets(prev => [...prev, { ...dragData, sourceZone: undefined }]);
    } else {
      setDestinationWallets(prev => [...prev, { ...dragData, sourceZone: undefined }]);
    }
  };

  const handleSingleZoneDrop = (dragData: any, targetZone: 'source' | 'destination' | 'main') => {
    console.log('Single zone drop:', dragData.address, 'from', dragData.sourceZone, 'to', targetZone);

    if (targetZone === 'main') {
      if (dragData.sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== dragData.address));
      } else if (dragData.sourceZone === 'destination') {
        setDestinationWallets(prev => prev.filter(w => w.address !== dragData.address));
      }
    } else {
      const sourceZone = dragData.sourceZone;

      if (sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== dragData.address));
      } else if (sourceZone === 'destination') {
        setDestinationWallets(prev => prev.filter(w => w.address !== dragData.address));
      }

      if (targetZone === 'source') {
        setSourceWallets(prev => {
          const exists = prev.some(w => w.address === dragData.address);
          if (exists) return prev;
          return [...prev, { ...dragData, sourceZone: undefined }];
        });
      } else if (targetZone === 'destination') {
        setDestinationWallets(prev => {
          const exists = prev.some(w => w.address === dragData.address);
          if (exists) return prev;
          return [...prev, { ...dragData, sourceZone: undefined }];
        });
      }
    }
  };
  const handleUniversalDrop = (e: React.DragEvent, targetZone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(null);
    setDropPreviewLine(null);

    console.log('Universal drop triggered for zone:', targetZone);

    try {
      let data = null;
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        data = JSON.parse(jsonData);
      } else {
        const textData = e.dataTransfer.getData('text/plain');
        if (textData) {
          data = JSON.parse(textData);
        }
      }

      if (!data) {
        console.log('No valid drag data found');
        return;
      }

      console.log('Processing drop data:', data.type, 'to', targetZone);

      switch (data.type) {
        case 'multi-drag':
          handleMultiDrop(e, targetZone);
          break;

        case 'reorder':
          if (data.container === targetZone) {
            handleReorderDrop(e, targetZone);
          }
          break;

        case 'single-zone-drag':
          if (data.sourceZone && data.sourceZone !== targetZone) {
            handleSingleZoneDrop(data, targetZone);
          }
          break;

        case 'single-main-drag':
          if (targetZone !== 'main') {
            handleSingleMainDrop(data, targetZone as 'source' | 'destination');
          }
          break;

        default:
          if (data.sourceZone) {
            handleSingleZoneDrop(data, targetZone);
          }
      }

    } catch (error) {
      console.error('Error handling drop:', error);
    }

    setDraggedWallet(null);
    setIsMultiDrag(false);
  };


  const handleDragOver = (e: React.DragEvent, zone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zone);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, zone: 'source' | 'destination') => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedWallet) return;

    const targetArray = zone === 'source' ? sourceWallets : destinationWallets;
    const isAlreadyInZone = targetArray.some(w => w.address === draggedWallet.address);

    if (isAlreadyInZone) return;

    if (zone === 'source') {
      setSourceWallets(prev => [...prev, { ...draggedWallet, sourceZone: undefined }]);
    } else {
      setDestinationWallets(prev => [...prev, { ...draggedWallet, sourceZone: undefined }]);
    }

    setDraggedWallet(null);
  };


  const handleDropBetweenZones = (e: React.DragEvent, targetZone: 'source' | 'destination') => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedWallet) return;
    if (draggedWallet.sourceZone) {
      const sourceZone = draggedWallet.sourceZone;
      if (sourceZone === targetZone) {
        setDraggedWallet(null);
        return;
      }
      if (sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
      } else {
        setDestinationWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
      }
      if (targetZone === 'source') {
        setSourceWallets(prev => {
          const exists = prev.some(w => w.address === draggedWallet.address);
          if (exists) return prev;
          return [...prev, { ...draggedWallet, sourceZone: undefined }];
        });
      } else {
        setDestinationWallets(prev => {
          const exists = prev.some(w => w.address === draggedWallet.address);
          if (exists) return prev;
          return [...prev, { ...draggedWallet, sourceZone: undefined }];
        });
      }
    }

    setDraggedWallet(null);
  };


  const clearAllZones = () => {
    setSourceWallets([]);
    setDestinationWallets([]);
  };

  const executeDistribution = async () => {
    if (sourceWallets.length === 0 || destinationWallets.length === 0 || !distributionAmount) {
      alert('Please add source wallets, destination wallets, and set an amount');
      return;
    }

    const amount = parseFloat(distributionAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsVaultDepositSigning(true);
      await handleSetChain();

      if (distributionMode === 'equal') {
      }
      for (const sourceWallet of sourceWallets) {
        const sourceWalletData = subWallets.find(w => w.address === sourceWallet.address);
        if (!sourceWalletData) continue;

        const amountPerSource = amount / sourceWallets.length;

        for (const destWallet of destinationWallets) {
          let transferAmount: number;

          if (distributionMode === 'equal') {
            transferAmount = amountPerSource / destinationWallets.length;
          } else {
            const totalDestValue = destinationWallets.reduce((sum, w) => sum + w.totalValue, 0);
            const proportion = destWallet.totalValue / (totalDestValue || 1);
            transferAmount = amountPerSource * proportion;
          }

          if (transferAmount > 0) {
            await handleSubwalletTransfer(
              sourceWallet.address,
              destWallet.address,
              transferAmount.toString(),
              sourceWalletData.privateKey
            );
          }
        }
      }

      for (const wallet of [...sourceWallets, ...destinationWallets]) {
        await refreshWalletBalance(wallet.address);
      }

      showDistributionSuccess(distributionAmount, sourceWallets.length, destinationWallets.length);
      clearAllZones();
      setDistributionAmount('');

    } catch (error) {
      console.error('Distribution failed:', error);
      alert('Distribution failed. Please try again.');
    } finally {
      setIsVaultDepositSigning(false);
    }
  };

  const createPortfolioSubWallet = async () => {
    try {
      if (!signTypedDataAsync || !keccak256 || !Wallet) {
        return;
      }

      const randomAccountNumber = Math.floor(Math.random() * 9000) + 1000;

      const privateKey = keccak256(await signTypedDataAsync({
        typedData: {
          types: {
            createCrystalOneCT: [
              { name: 'version', type: 'string' },
              { name: 'account', type: 'uint256' },
            ],
          },
          primaryType: 'createCrystalOneCT',
          message: {
            version: 'Crystal Testnet',
            account: BigInt(randomAccountNumber),
          }
        }
      }));

      const tempWallet = new Wallet(privateKey);
      const walletAddress = tempWallet.address;

      const newWallet = {
        address: walletAddress,
        privateKey: privateKey
      };

      const updatedWallets = [...subWallets, newWallet];
      setSubWallets(updatedWallets);
      saveSubWalletsToStorage(updatedWallets);

      showWalletCreated();
    } catch (error) {
    }
  };

  const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false);

  const openExportModal = (wallet: { address: string, privateKey: string }) => {
    setExportingWallet(wallet);
    setPrivateKeyRevealed(false);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportingWallet(null);
    setPrivateKeyRevealed(false);
  };

  const revealPrivateKey = () => {
    setPrivateKeyRevealed(true);
  };


  const handleImportWallet = async () => {
    setImportError('');
    setIsImporting(true);

    try {
      if (!importPrivateKey.trim()) {
        setImportError('Please enter a private key');
        return;
      }

      let formattedKey = importPrivateKey.trim();
      if (!formattedKey.startsWith('0x')) {
        formattedKey = '0x' + formattedKey;
      }

      if (!isValidPrivateKey(formattedKey)) {
        setImportError('Invalid private key format (must be 64 hex characters)');
        return;
      }

      const existingWallet = subWallets.find(w => w.privateKey.toLowerCase() === formattedKey.toLowerCase());
      if (existingWallet) {
        setImportError('This wallet is already imported');
        return;
      }

      let walletAddress: string;
      try {
        if (Wallet) {
          const tempWallet = new Wallet(formattedKey);
          walletAddress = tempWallet.address;
        } else {
          setImportError('Wallet functionality not available');
          return;
        }
      } catch (walletError) {
        setImportError('Invalid private key - unable to create wallet');
        return;
      }

      const existingAddress = subWallets.find(w => w.address.toLowerCase() === walletAddress.toLowerCase());
      if (existingAddress) {
        setImportError('A wallet with this address already exists');
        return;
      }

      const newWallet = {
        address: walletAddress,
        privateKey: formattedKey
      };

      const updatedWallets = [...subWallets, newWallet];
      setSubWallets(updatedWallets);
      saveSubWalletsToStorage(updatedWallets);

      console.log('Wallet Imported:', { address: walletAddress, privateKey: '***' });
      closeImportModal();
      showWalletImported(walletAddress);
    } catch (error) {
      console.error('Error importing wallet:', error);
      setImportError('Failed to import wallet. Please check your private key.');
    } finally {
      setIsImporting(false);
    }
  };

  const openImportModal = () => {
    setImportPrivateKey('');
    setImportError('');
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportPrivateKey('');
    setImportError('');
  };


  const startEditingWallet = (address: string) => {
    setEditingWallet(address);
    setEditingName(walletNames[address] || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}`);
  };

  const saveWalletName = (address: string) => {
    const newWalletNames = { ...walletNames, [address]: editingName || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}` };
    setWalletNames(newWalletNames);
    localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));
    setEditingWallet(null);
    setEditingName('');
  };

  const getWalletName = (address: string, walletIndex?: number) => {
    if (walletNames[address]) {
      return walletNames[address];
    }
    const actualIndex = subWallets.findIndex(w => w.address === address);
    return `Wallet ${actualIndex !== -1 ? actualIndex + 1 : (walletIndex !== undefined ? walletIndex + 1 : 1)}`;
  };
  const [isDepositing, setIsDepositing] = useState(false);

  const openDepositModal = (targetWallet: React.SetStateAction<string>) => {
    setDepositTargetWallet(targetWallet);
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setDepositTargetWallet('');
    setDepositAmount('');
  };

  const [showPNLCalendar, setShowPNLCalendar] = useState(false);
  const [pnlCalendarLoading, setPNLCalendarLoading] = useState(false);

  const handleDepositFromEOA = async () => {
    if (!depositAmount || !depositTargetWallet) {
      return;
    }

    try {
      setIsDepositing(true);

      console.log('Setting chain...');
      await handleSetChain();

      const ethAmount = BigInt(Math.round(parseFloat(depositAmount) * 1e18));
      console.log('Amount in Wei:', ethAmount.toString());

      const mainWalletBalance = getMainWalletBalance();
      if (parseFloat(depositAmount) > mainWalletBalance) {
        throw new Error(`Insufficient balance in main wallet. Available: ${mainWalletBalance.toFixed(4)} MON`);
      }

      console.log('Sending transaction from main wallet...');
      const result = await sendUserOperationAsync({
        uo: {
          target: depositTargetWallet,
          value: ethAmount,
          data: '0x'
        }
      });

      console.log('Transaction result:', result);

      let hash;
      if (typeof result === 'string') {
        hash = result;
      } else if (result && result.hash) {
        hash = result.hash;
      } else if (result && result.transactionHash) {
        hash = result.transactionHash;
      } else {
        console.log('Unexpected result format:', result);
        hash = result;
      }

      console.log('Transaction hash:', hash);

      if (hash && waitForTxReceipt) {
        console.log('Waiting for transaction receipt...');
        try {
          const receiptPromise = waitForTxReceipt({ hash });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Transaction timeout')), 30000)
          );

          await Promise.race([receiptPromise, timeoutPromise]);
          console.log('Transaction confirmed');
        } catch (receiptError) {
          console.warn('Receipt waiting failed, but transaction may still be successful:', receiptError);
        }
      }
      try {
        await refreshWalletBalance(depositTargetWallet);
        console.log('Target wallet balance refreshed');
      } catch (refreshError) {
        console.warn('Failed to refresh target wallet balance:', refreshError);
      }

      try {
        refetch();
        console.log('Main account data refreshed');
      } catch (refetchError) {
        console.warn('Failed to refresh main account:', refetchError);
      }

      closeDepositModal();
      showDepositSuccess(depositAmount, depositTargetWallet);

    } catch (error) {
    } finally {
      setIsDepositing(false);
    }
  };

  const [customDestinationAddress, setCustomDestinationAddress] = useState<string>('');
  const [customAddressError, setCustomAddressError] = useState<string>('');
  const calculateMaxAmount = () => {
    const totalSourceBalance = sourceWallets.reduce((total, wallet) => {
      return total + getWalletBalance(wallet.address);
    }, 0);
    return totalSourceBalance;
  };
  const handleMaxAmount = () => {
    const maxAmount = calculateMaxAmount();
    setDistributionAmount(maxAmount.toString());
  };

  const handleAddCustomAddress = () => {
    setCustomAddressError('');

    if (!customDestinationAddress.trim()) {
      setCustomAddressError('Please enter an address');
      return;
    }

    if (!isValidAddress(customDestinationAddress.trim())) {
      setCustomAddressError('Invalid address format');
      return;
    }

    const isAlreadyAdded = destinationWallets.some(w =>
      w.address.toLowerCase() === customDestinationAddress.trim().toLowerCase()
    );

    if (isAlreadyAdded) {
      setCustomAddressError('Address already added to destinations');
      return;
    }

    const customWallet: WalletDragItem = {
      address: customDestinationAddress.trim(),
      name: `Custom (${customDestinationAddress.slice(0, 6)}...${customDestinationAddress.slice(-4)})`,
      balance: 0,
      totalValue: 0,
      index: -1
    };

    setDestinationWallets(prev => [...prev, customWallet]);
    setCustomDestinationAddress('');
  };

  const handleSendBackToMain = async () => {
    if (destinationWallets.length === 0) {
      alert('No destination wallets to send from');
      return;
    }

    try {
      setIsVaultDepositSigning(true);
      await handleSetChain();

      for (const destWallet of destinationWallets) {
        const sourceWalletData = subWallets.find(w => w.address === destWallet.address);
        if (!sourceWalletData) continue;

        const walletBalance = getWalletBalance(destWallet.address);
        if (walletBalance > 0.001) {
          const transferAmount = walletBalance - 0.001;

          await handleSubwalletTransfer(
            destWallet.address,
            address,
            transferAmount.toString(),
            sourceWalletData.privateKey
          );
        }
      }

      for (const wallet of destinationWallets) {
        await refreshWalletBalance(wallet.address);
      }
      refetch();

      showSendBackSuccess(destinationWallets.length);

    } catch (error) {
      console.error('Send back to main wallet failed:', error);
      alert('Send back to main wallet failed. Please try again.');
    } finally {
      setIsVaultDepositSigning(false);
    }
  };


  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);
    if (ethToken && balances[ethToken.address]) {
      return Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals);
    }

    return 0;
  };

  interface SelectionRect {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }

  interface DragReorderState {
    draggedIndex: number;
    dragOverIndex: number;
    dragOverPosition: 'top' | 'bottom' | null;
  }

  const [_selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [activeSelectionContainer, setActiveSelectionContainer] = useState<'main' | 'source' | 'destination' | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [_dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMultiDrag, setIsMultiDrag] = useState(false);

  const [dragReorderState, setDragReorderState] = useState<DragReorderState>({
    draggedIndex: -1,
    dragOverIndex: -1,
    dragOverPosition: null
  });
  const [dropPreviewLine, setDropPreviewLine] = useState<{ top: number; containerKey: string } | null>(null);

  const startSelection = (e: React.MouseEvent, containerKey: 'main' | 'source' | 'destination') => {
    if (e.button !== 0) return;

    if ((e.target as HTMLElement).closest('.draggable-wallet-item')) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      setSelectedWalletsPerContainer({
        main: new Set(),
        source: new Set(),
        destination: new Set()
      });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setActiveSelectionContainer(containerKey);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    setSelectionRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
  };


  const [selectedWalletsPerContainer, setSelectedWalletsPerContainer] = useState<{
    main: Set<string>;
    source: Set<string>;
    destination: Set<string>;
  }>({
    main: new Set(),
    source: new Set(),
    destination: new Set()
  });
  const updateSelection = (e: React.MouseEvent, container: HTMLElement, containerKey: 'main' | 'source' | 'destination') => {
    if (activeSelectionContainer !== containerKey || !selectionRect) return;

    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelectionRect(prev => prev ? {
      ...prev,
      currentX,
      currentY
    } : null);

    const walletElements = container.querySelectorAll('.draggable-wallet-item');
    const newSelection = new Set<string>();

    walletElements.forEach((element) => {
      const walletRect = element.getBoundingClientRect();
      const elementRect = {
        left: walletRect.left - rect.left,
        top: walletRect.top - rect.top,
        right: walletRect.right - rect.left,
        bottom: walletRect.bottom - rect.top
      };

      const selectionBounds = {
        left: Math.min(selectionRect.startX, currentX),
        top: Math.min(selectionRect.startY, currentY),
        right: Math.max(selectionRect.startX, currentX),
        bottom: Math.max(selectionRect.startY, currentY)
      };

      if (elementRect.left < selectionBounds.right &&
        elementRect.right > selectionBounds.left &&
        elementRect.top < selectionBounds.bottom &&
        elementRect.bottom > selectionBounds.top) {

        const walletAddress = element.getAttribute('data-wallet-address');
        if (walletAddress) newSelection.add(walletAddress);
      }
    });

    setPreviewSelection(newSelection);
  };
  const endSelection = () => {
    if (activeSelectionContainer && previewSelection.size > 0) {
      setSelectedWalletsPerContainer(prev => {
        const combined = new Set(prev[activeSelectionContainer]);
        previewSelection.forEach(addr => combined.add(addr));
        return {
          ...prev,
          [activeSelectionContainer]: combined
        };
      });
    }

    setPreviewSelection(new Set());
    setActiveSelectionContainer(null);
    setSelectionRect(null);
    setDragStartPoint(null);
  };


  const handleMultiDragStart = (e: React.DragEvent, containerType: 'main' | 'source' | 'destination') => {
    e.stopPropagation();
    setIsMultiDrag(true);

    const walletsInContainer = getWalletsForContainer(containerType);
    const selectedWalletsData = walletsInContainer
      .filter((w) => {
        return selectedWalletsPerContainer[containerType].has(w.address);
      })
      .map((w, arrayIndex) => {
        const actualIndex = containerType === 'main'
          ? subWallets.findIndex(sw => sw.address === w.address)
          : arrayIndex;

        return {
          address: w.address,
          name: getWalletName(w.address),
          balance: getWalletBalance(w.address),
          totalValue: getTotalWalletValue(w.address),
          index: actualIndex,
        };
      });

    console.log('Multi-drag data prepared:', {
      containerType,
      selectedCount: selectedWalletsData.length,
      wallets: selectedWalletsData.map(w => w.address)
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'multi-drag',
      wallets: selectedWalletsData,
      sourceContainer: containerType,
      count: selectedWalletsData.length,
      timestamp: Date.now()
    }));
  };
  const handleMultiDrop = (e: React.DragEvent, targetZone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(null);
    setDropPreviewLine(null);

    console.log('Multi-drop triggered for zone:', targetZone);

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      console.log('Drop data received:', jsonData ? 'JSON data found' : 'No JSON data');

      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log('Parsed drop data:', data);

        if (data.type === 'multi-drag' && data.wallets && data.wallets.length > 0) {
          const { wallets, sourceContainer } = data;
          console.log(`Processing multi-drop: ${wallets.length} wallets from ${sourceContainer} to ${targetZone}`);

          if (sourceContainer !== targetZone) {
            if (sourceContainer === 'source') {
              setSourceWallets(prev => {
                const filtered = prev.filter(w => !wallets.some((sw: any) => sw.address === w.address));
                console.log('Removed from source:', prev.length - filtered.length);
                return filtered;
              });
            } else if (sourceContainer === 'destination') {
              setDestinationWallets(prev => {
                const filtered = prev.filter(w => !wallets.some((sw: any) => sw.address === w.address));
                console.log('Removed from destination:', prev.length - filtered.length);
                return filtered;
              });
            }

            if (targetZone === 'source') {
              setSourceWallets(prev => {
                const newWallets = wallets.filter((w: any) => !prev.some(pw => pw.address === w.address));
                console.log('Adding to source:', newWallets.length);
                return [...prev, ...newWallets];
              });
            } else if (targetZone === 'destination') {
              setDestinationWallets(prev => {
                const newWallets = wallets.filter((w: any) => !prev.some(pw => pw.address === w.address));
                console.log('Adding to destination:', newWallets.length);
                return [...prev, ...newWallets];
              });
            }
          }
          setSelectedWalletsPerContainer({
            main: new Set(),
            source: new Set(),
            destination: new Set()
          });
          setIsMultiDrag(false);
          console.log('Multi-drop completed successfully');
          return;
        } else if (data.type === 'reorder') {
          console.log('Handling reorder drop');
          handleReorderDrop(e, targetZone as any);
          return;
        }
      }
    } catch (error) {
      console.error('Error handling multi-drop JSON:', error);
    }

    console.log('Falling back to single drop handling');
    try {
      const textData = e.dataTransfer.getData('text/plain');
      if (textData) {
        handleDrop(e, targetZone as any);
        return;
      }
    } catch (error) {
      console.error('Error handling text drop data:', error);
    }
    setIsMultiDrag(false);
    if (draggedWallet?.sourceZone) {
      handleDropBetweenZones(e, targetZone as any);
    } else {
      handleDrop(e, targetZone as any);
    }
  };

  const handleReorderDragStart = (e: React.DragEvent, walletIndex: number, containerType: 'main' | 'source' | 'destination') => {

    setDragReorderState(prev => ({ ...prev, draggedIndex: walletIndex }));

    const reorderData = {
      type: 'reorder',
      index: walletIndex,
      container: containerType,
      timestamp: Date.now()
    };

    console.log('Setting reorder data:', reorderData);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(reorderData));

    e.dataTransfer.setData('text/plain', JSON.stringify(reorderData));
  };


  useEffect(() => {
    const handleGlobalMouseUp = () => {
      endSelection();
      setDropPreviewLine(null);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWallets(new Set());
        setIsMultiDrag(false);
        setDropPreviewLine(null);
        endSelection();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleReorderDragOver = (e: React.DragEvent, targetIndex: number, containerKey: string) => {
    e.preventDefault();
    if (isMultiDrag) {
      return;
    }

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;

    setDragReorderState(prev => ({
      ...prev,
      dragOverIndex: targetIndex,
      dragOverPosition: isTopHalf ? 'top' : 'bottom'
    }));

    const parentElement = element.parentElement;
    if (parentElement) {
      const parentRect = parentElement.getBoundingClientRect();
      const lineTop = isTopHalf ?
        rect.top - parentRect.top :
        rect.bottom - parentRect.top;

      setDropPreviewLine({ top: lineTop, containerKey });
    }
  };

  const handleReorderDrop = (e: React.DragEvent, containerType: 'main' | 'source' | 'destination') => {
    e.preventDefault();

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData || jsonData.trim() === '') {
        console.log('No JSON data found for reorder operation');
        return;
      }

      const data = JSON.parse(jsonData);

      if (data.type === 'reorder' && data.container === containerType) {
        const { index: draggedIndex } = data;
        const { dragOverIndex, dragOverPosition } = dragReorderState;
        if (draggedIndex === dragOverIndex) return;
        let targetIndex = dragOverIndex;
        if (dragOverPosition === 'bottom') targetIndex++;
        if (draggedIndex < targetIndex) targetIndex--;
        if (containerType === 'main') {
          const reorderedWallets = [...subWallets];
          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSubWallets(reorderedWallets);
          saveSubWalletsToStorage(reorderedWallets);
        } else if (containerType === 'source') {
          const reorderedWallets = [...sourceWallets];
          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSourceWallets(reorderedWallets);
        } else if (containerType === 'destination') {
          const reorderedWallets = [...destinationWallets];
          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setDestinationWallets(reorderedWallets);
        }
      }
    } catch (error) {
      console.error('Error handling reorder drop:', error);
    }
    setDragReorderState({ draggedIndex: -1, dragOverIndex: -1, dragOverPosition: null });
    setDropPreviewLine(null);
  };

  const getWalletsForContainer = (containerType: 'main' | 'source' | 'destination') => {
    switch (containerType) {
      case 'main':
        return subWallets.filter(wallet =>
          !sourceWallets.some(w => w.address === wallet.address) &&
          !destinationWallets.some(w => w.address === wallet.address)
        );
      case 'source':
        return sourceWallets;
      case 'destination':
        return destinationWallets;
      default:
        return [];
    }
  };
  const renderWalletItem = (wallet: any, index: number, containerType: 'main' | 'source' | 'destination', containerKey: string) => {
    const isSelected = selectedWalletsPerContainer[containerType].has(wallet.address);
    const isPreviewSelected = previewSelection.has(wallet.address);
    const isDragging = dragReorderState.draggedIndex === index;
    const isDragOver = dragReorderState.dragOverIndex === index;

    return (
      <div
        key={wallet.address}
        data-wallet-address={wallet.address}
        className={`draggable-wallet-item ${isSelected ? 'selected' : ''} ${isPreviewSelected ? 'preview-selected' : ''} ${isDragging ? 'dragging' : ''} ${isMultiDrag && isSelected ? 'multi-drag-ghost' : ''}`}
        draggable
        onDragStart={(e) => {
          setDropPreviewLine(null);
          setDragReorderState({ draggedIndex: -1, dragOverIndex: -1, dragOverPosition: null });

          if (selectedWalletsPerContainer[containerType].size > 1 && isSelected) {
            console.log('Starting multi-drag with', selectedWalletsPerContainer[containerType].size, 'wallets');
            handleMultiDragStart(e, containerType);
            return;
          }

          setSelectedWalletsPerContainer(prev => ({
            ...prev,
            [containerType]: new Set([wallet.address])
          }));

          if (containerType === 'main') {
            if (e.shiftKey) {
              handleReorderDragStart(e, index, containerType);
            } else {
              handleDragStart(e, wallet, index);
            }
          } else {
            if (e.shiftKey) {
              handleReorderDragStart(e, index, containerType);
            } else {
              handleDragStartFromZone(e, wallet, containerType);
            }
          }
        }}
        onDragEnd={() => {
          setIsMultiDrag(false);
          setDragReorderState({ draggedIndex: -1, dragOverIndex: -1, dragOverPosition: null });
          setDropPreviewLine(null);
          setDraggedWallet(null);
          setDragOverZone(null);
          console.log('Drag ended, cleaned up states');
        }}
        onDragOver={(e) => {
          if (!isMultiDrag) {
            handleReorderDragOver(e, index, containerKey);
          }
        }}
        onDragLeave={(e) => {
          const relatedTarget = e.relatedTarget as Node;
          if (!e.currentTarget.contains(relatedTarget)) {
            setDropPreviewLine(null);
            setDragReorderState(prev => ({ ...prev, dragOverIndex: -1, dragOverPosition: null }));
          }
        }}
        onDrop={() => {
          return;
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Wallet clicked:', wallet.address, 'Ctrl held:', e.ctrlKey, 'Container:', containerType);

          if (e.ctrlKey || e.metaKey) {
            setSelectedWalletsPerContainer(prev => {
              const newContainerSet = new Set(prev[containerType]);
              if (newContainerSet.has(wallet.address)) {
                newContainerSet.delete(wallet.address);
              } else {
                newContainerSet.add(wallet.address);
              }
              console.log(`New selection for ${containerType}:`, Array.from(newContainerSet));
              return {
                ...prev,
                [containerType]: newContainerSet
              };
            });
          } else {
            setSelectedWalletsPerContainer({
              main: containerType === 'main' ? new Set([wallet.address]) : new Set(),
              source: containerType === 'source' ? new Set([wallet.address]) : new Set(),
              destination: containerType === 'destination' ? new Set([wallet.address]) : new Set()
            });
            console.log(`Single selected in ${containerType}:`, wallet.address);
          }
        }}
      >
        {!isMultiDrag && dropPreviewLine && dropPreviewLine.containerKey === containerKey && isDragOver && (
          <div
            className="drop-preview-line"
            style={{
              top: dragReorderState.dragOverPosition === 'top' ? -1 : '100%'
            }}
          />
        )}

        <div className="wallet-active-checkbox-container">
          <Tooltip content={isWalletActive(wallet.privateKey) ? "Active Wallet" : "Set as Active Wallet"}>
            <input
              type="checkbox"
              className="wallet-active-checkbox"
              checked={isWalletActive(wallet.privateKey)}
              onChange={(e) => {
                e.stopPropagation();
                if (!isWalletActive(wallet.privateKey)) {
                  localStorage.setItem('crystal_active_wallet_private_key', wallet.privateKey);
                  setOneCTSigner(wallet.privateKey);
                  refetch();
                  console.log('Set active wallet and saved to localStorage:', wallet.address);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        </div>

        <div className="wallet-drag-info">
          <div className="wallet-name-container">
            {editingWallet === wallet.address ? (
              <div className="wallet-name-edit-container">
                <input
                  type="text"
                  className="wallet-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveWalletName(wallet.address);
                    } else if (e.key === 'Escape') {
                      setEditingWallet(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onBlur={() => saveWalletName(wallet.address)}
                />
              </div>
            ) : (
              <div className="wallet-name-display">
                <span
                  className={`wallet-drag-name ${isWalletActive(wallet.privateKey) ? 'active' : ''}`}
                  style={{
                    color: isWalletActive(wallet.privateKey) ? '#d8dcff' : '#fff'
                  }}
                >
                  {getWalletName(wallet.address, index)}
                </span>
                <Edit2
                  size={12}
                  className="wallet-name-edit-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingWallet(wallet.address);
                  }}
                />
              </div>
            )}
          </div>
          <div className="wallet-drag-address">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            <img
              src={copy}
              className="wallets-copy-icon"
              alt="Copy"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(wallet.address);
              }}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        <div className="wallet-drag-actions">
          <Tooltip content="Deposit from Main Wallet">
            <button
              className="wallet-icon-button"
              onClick={(e) => {
                e.stopPropagation();
                openDepositModal(wallet.address);
              }}
            >
              <Plus size={14} className="wallet-action-icon" />
            </button>
          </Tooltip>

          <Tooltip content="Export Private Key">
            <button
              className="wallet-icon-button key-button"
              onClick={(e) => {
                e.stopPropagation();
                openExportModal(wallet);
              }}
            >
              <img src={key} className="wallet-action-icon" alt="Export Key" />
            </button>
          </Tooltip>

          <Tooltip content="View on Explorer">
            <a
              href={`https://testnet.monadexplorer.com/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-icon-button explorer-button"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="wallet-action-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
              </svg>
            </a>
          </Tooltip>

          <Tooltip content="Delete Wallet">
            <button
              className="wallet-icon-button delete-button"
              onClick={(e) => {
                e.stopPropagation();
                confirmDeleteWallet(wallet.address);
              }}
            >
              <img src={trash} className="wallet-action-icon" alt="Delete Wallet" />
            </button>
          </Tooltip>
        </div>

        <div className="wallet-drag-values">
          <div className={`wallet-drag-balance ${isBlurred ? 'blurred' : ''}`}>
            <img src={monadicon} className="wallet-drag-balance-mon-icon" alt="MON" />
            {getWalletBalance(wallet.address).toFixed(2)}
          </div>
        </div>
      </div>
    );
  };

  const renderWalletContainer = (
    wallets: any[],
    containerType: 'main' | 'source' | 'destination',
    containerKey: string,
    emptyMessage: string,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    const isThisContainerSelecting = activeSelectionContainer === containerType;

    return (
      <div
        ref={containerRef}
        className={`${containerType === 'main' ? 'drag-wallets-list' : 'drop-zone-wallets'} ${isThisContainerSelecting ? 'selecting' : ''}`}
        onMouseDown={(e) => startSelection(e, containerType)}
        onMouseMove={(e) => {
          if (isThisContainerSelecting && containerRef.current) {
            updateSelection(e, containerRef.current, containerType);
          }
        }}
        onMouseUp={endSelection}
        onMouseLeave={endSelection}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverZone(containerType);
        }}
        onDrop={(e) => handleUniversalDrop(e, containerType)}
        onDragLeave={(e) => {
          const relatedTarget = e.relatedTarget as Node;
          if (!e.currentTarget.contains(relatedTarget)) {
            setDragOverZone(null);
          }
        }}
        style={{ position: 'relative' }}
      >
        {isThisContainerSelecting && selectionRect && (
          <div
            className="selection-rectangle"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.currentX),
              top: Math.min(selectionRect.startY, selectionRect.currentY),
              width: Math.abs(selectionRect.currentX - selectionRect.startX),
              height: Math.abs(selectionRect.currentY - selectionRect.startY),
            }}
          />
        )}

        {wallets.length === 0 ? (
          <div className="drop-zone-empty">
            <div className="drop-zone-text">{emptyMessage}</div>
          </div>
        ) : (
          wallets.map((wallet, index) => renderWalletItem(wallet, index, containerType, containerKey))
        )}
      </div>
    );
  };

  const getTotalWalletValue = (address: string) => {
    return walletTotalValues[address] || 0;
  };

  const handleConfirmSpectating = () => {
    if (searchInput.trim() && isValidAddress(searchInput.trim())) {
      if (onStartSpectating) {
        onStartSpectating(searchInput.trim());
      } else {
        setInternalSpectatedAddress(searchInput.trim());
        setInternalIsSpectating(true);
      }

      if (onSpectatingChange) {
        onSpectatingChange(true, searchInput.trim());
      }

      refetch(searchInput.trim());
    } else {
      alert('Please enter a valid wallet address');
    }
  };

  const isButtonDisabled = !isSpectating && (!searchInput.trim() || !isValidAddress(searchInput.trim()));

  const clearSpectating = () => {
    if (onStopSpectating) {
      onStopSpectating();
    } else {
      setInternalIsSpectating(false);
      setInternalSpectatedAddress('');
    }

    if (onSpectatingChange) {
      onSpectatingChange(false, null);
    }

    setSearchInput('');
    refetch(originalAddress || address);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmSpectating();
    }
  };

  const getTimeRangeText = (timeRange: string) => {
    switch (timeRange) {
      case '24H':
        return 'day';
      case '7D':
        return 'week';
      case '14D':
        return 'two weeks';
      case '30D':
        return 'month';
      default:
        return 'week';
    }
  };

  const handlePercentageChange = (value: number) => {
    setPercentage(value);
  };
  useEffect(() => {
    const totalSelected = Object.values(selectedWalletsPerContainer).reduce((sum, set) => sum + set.size, 0);
    if (totalSelected <= 1) {
      setIsMultiDrag(false);
    }
  }, [selectedWalletsPerContainer]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWalletsPerContainer({
          main: new Set(),
          source: new Set(),
          destination: new Set()
        });
        setIsMultiDrag(false);
        setDropPreviewLine(null);
        endSelection();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (activeWalletPrivateKey) {
      localStorage.setItem('crystal_active_wallet_private_key', activeWalletPrivateKey);
    }
  }, [activeWalletPrivateKey]);

  useEffect(() => {
    const savedActivePrivateKey = localStorage.getItem('crystal_active_wallet_private_key');

    if (savedActivePrivateKey && subWallets.length > 0) {
      const savedWalletExists = subWallets.some(wallet => wallet.privateKey === savedActivePrivateKey);

      if (savedWalletExists && activeWalletPrivateKey !== savedActivePrivateKey) {
        setOneCTSigner(savedActivePrivateKey);
        console.log('Restored active wallet from localStorage');
      }
    }
  }, [subWallets, activeWalletPrivateKey, setOneCTSigner]);

  useEffect(() => {
    const now = Date.now() / 1000;
    const timeago = now - 24 * 60 * 60 * days;
    let volume = 0;

    tradehistory.forEach((trade) => {
      const marketKey = trade[4];
      const tradeTime = trade[6];
      const tradeSide = trade[2];
      const amount = trade[0];
      const price = trade[1];

      if (
        typeof tradeTime === 'number' &&
        tradeTime >= timeago
      ) {
        const quotePrice = markets[marketKey].quoteAsset == 'USDC' ? 1 : trades[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.[0]?.[3]
          / Number(markets[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.priceFactor)
        volume += (tradeSide === 1 ? amount : price) * quotePrice / 10 ** Number(markets[marketKey].quoteDecimals);
      }
    });

    setTotalVolume(parseFloat(volume.toFixed(2)));
  }, [tradehistory, days]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'spot':
      default:
        return (
          <div className="portfolio-layout-with-referrals">
            <ReferralSidebar
              markets={markets}
              router={router}
              usedRefAddress={usedRefAddress as `0x${string}`}
              address={getActiveAddress() as `0x${string}`}
              usedRefLink={usedRefLink}
              setUsedRefLink={setUsedRefLink}
              setUsedRefAddress={setUsedRefAddress}
              totalClaimableFees={totalClaimableFees}
              claimableFees={claimableFees}
              refLink={refLink}
              setRefLink={setRefLink}
              setChain={setChain}
              setpopup={setpopup}
              account={account}
              refetch={refetch}
              sendUserOperationAsync={sendUserOperationAsync}
              waitForTxReceipt={waitForTxReceipt}
              client={client}
              activechain={activechain}
            />

            <div className="portfolio-left-column">
              <div className="graph-outer-container">
                {portChartLoading ? (
                  <div className="graph-container">
                    <Overlay isVisible={true} bgcolor={'rgb(6,6,6)'} height={15} maxLogoHeight={100} />
                  </div>
                ) : (
                  <div className="graph-container">
                    <span className="graph-label">
                      {isSpectating ? t("spectatingPerformance") : t("performance")}
                    </span>
                    <PortfolioGraph
                      address={getActiveAddress()}
                      colorValue={portfolioColorValue}
                      setColorValue={setPortfolioColorValue}
                      isPopup={false}
                      onPercentageChange={handlePercentageChange}
                      chartData={chartData}
                      portChartLoading={portChartLoading}
                      chartDays={chartDays}
                      setChartDays={setChartDays}
                      isBlurred={isBlurred}
                    />
                  </div>
                )}
              </div>
              <div className="order-section">
                <div className="portfolio-order-center-wrapper">
                  <OrderCenter
                    orders={orders}
                    tradehistory={tradehistory}
                    canceledorders={canceledorders}
                    router={router}
                    address={getActiveAddress()}
                    trades={trades}
                    currentMarket={''}
                    orderCenterHeight={orderCenterHeight}
                    tokenList={tokenList}
                    onMarketSelect={onMarketSelect}
                    setSendTokenIn={setSendTokenIn}
                    setpopup={setpopup}
                    sortConfig={sortConfig}
                    onSort={setSortConfig}
                    tokenBalances={tokenBalances}
                    hideMarketFilter={true}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    filter={filter}
                    setFilter={setFilter}
                    onlyThisMarket={onlyThisMarket}
                    setOnlyThisMarket={setOnlyThisMarket}
                    isPortfolio={true}
                    refetch={refetch}
                    sendUserOperationAsync={sendUserOperationAsync}
                    setChain={setChain}
                    isBlurred={isBlurred}
                    waitForTxReceipt={waitForTxReceipt}
                    openEditOrderPopup={() => { }}
                    openEditOrderSizePopup={() => { }}
                    marketsData={marketsData}
                  />
                </div>
              </div>
            </div>

            <div className="account-stats-wrapper">
              <div className="controls-container">
                <button
                  className="control-button"
                  onClick={() => setIsBlurred(!isBlurred)}
                >
                  <div style={{ position: 'relative' }}>
                    <Eye className="control-icon" size={12} />
                    <div className={`port-eye-slash ${isBlurred ? '' : 'hidden'}`} />
                  </div>
                  Hide Balances
                </button>

                <button
                  className="control-button"
                  onClick={() => {
                    account.logout()
                  }}
                >
                  <svg
                    className="control-icon"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" />
                    <path d="M2 12H14.88" />
                    <path d="M12.65 8.6499L16 11.9999L12.65 15.3499" />
                  </svg>
                  Disconnect
                </button>
              </div>
              <div
                className={`account-summary-container ${percentage >= 0 ? 'positive' : 'negative'}`}
              >
                <div className="account-header">
                  {isSpectating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <EyeIcon size={16} style={{ color: '#ff6b6b' }} />
                      <span>SPECTATING</span>
                    </div>
                  ) : (
                    t("account")
                  )}
                </div>
                {isSpectating && (
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '8px',
                    wordBreak: 'break-all'
                  }}>
                    {spectatedAddress.slice(0, 6)}...{spectatedAddress.slice(-4)}
                  </div>
                )}
                <div className="total-value-container">
                  <span className={`total-value ${isBlurred ? 'blurred' : ''}`}>
                    ${formatCommas(typeof totalAccountValue === 'number' ? totalAccountValue.toFixed(2) : '0.00')}
                  </span>
                  <div className="percentage-change-container">
                    <span
                      className={`percentage-value ${isBlurred ? 'blurred' : ''} ${percentage >= 0 ? 'positive' : 'negative'
                        }`}
                    >
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
                      )}
                    </span>
                    <span className="time-range">
                      (past {getTimeRangeText(timeRange)})
                    </span>
                  </div>
                </div>
              </div>
              <div className="trading-stats-container">
                <div className="trading-stats-header">
                  <span className="trading-stats-title">
                    {isSpectating ? t("spectatedTradingStats") : t("tradingStats")}
                  </span>
                </div>
                <div className="stats-list">
                  <div className="stat-row">
                    Total Volume
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `$${formatCommas(getActiveAddress() ? totalVolume.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Session High
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `$${formatCommas(getActiveAddress() ? high.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Session Low
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `${formatCommas(getActiveAddress() ? low.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Active Orders
                    <span className={`account-stat-value`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `${getActiveAddress() ? activeOrders : 0}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'wallets':
        return (
          <div className="wallets-drag-drop-layout">
            <div className="wallets-left-panel">
              <div className="wallets-summary">
                <div className="wallets-summary-left">
                  <div className="summary-item">
                    <span className="summary-label">Total Wallets</span>
                    <span className="summary-value">{subWallets.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Enabled Wallets</span>
                    <span className="summary-value">{enabledWallets.size}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Combined Value</span>
                    <span className={`summary-value ${isBlurred ? 'blurred' : ''}`}>
                      {walletsLoading ? (
                        <div className="port-loading" style={{ width: 100 }} />
                      ) : (
                        `${subWallets.reduce((total, wallet) => total + getTotalWalletValue(wallet.address), 0).toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="wallets-summary-right">
                  <button
                    className="import-wallet-button"
                    onClick={openImportModal}
                  >
                    Import
                  </button>
                  <button
                    className="create-wallet-button"
                    onClick={createPortfolioSubWallet}
                  >
                    Create Subwallet
                  </button>
                </div>
              </div>

              {subWallets.length === 0 ? (
                <div className="no-wallets-container">
                  <div className="no-wallets-message">
                    <h4>No Sub Wallets Found</h4>
                    <p>Create sub wallets to manage multiple wallets from one interface and trade with 1CT.</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                      <button
                        className="create-wallet-cta-button"
                        onClick={createPortfolioSubWallet}
                      >
                        Create Subwallet
                      </button>
                      <button
                        className="import-wallet-cta-button"
                        onClick={openImportModal}
                      >
                        Import Wallet
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="drag-wallets-container">
                  {renderWalletContainer(
                    subWallets.filter(wallet =>
                      !sourceWallets.some(w => w.address === wallet.address) &&
                      !destinationWallets.some(w => w.address === wallet.address)
                    ),
                    'main',
                    'main-wallets',
                    'Drag wallets here',
                    mainWalletsRef
                  )}
                </div>
              )}
            </div>

            <div className="wallets-right-panel">
              <div
                className={`drop-zone source-zone ${dragOverZone === 'source' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'source')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleUniversalDrop(e, 'source')}              >
                <div className="drop-zone-header">
                  <span className="drop-zone-title">Source Wallets</span>
                  <span className="drop-zone-count">{sourceWallets.length}</span>
                  {sourceWallets.length > 0 && (
                    <button
                      className="clear-zone-button"
                      onClick={() => setSourceWallets([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {renderWalletContainer(
                  sourceWallets,
                  'source',
                  'source-wallets',
                  'Drag source wallets here',
                  sourceWalletsRef
                )}
              </div>

              <div
                className={`drop-zone destination-zone ${dragOverZone === 'destination' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'destination')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleUniversalDrop(e, 'destination')}              >
                <div className="drop-zone-header2">
                  <div className="destination-wallets-container">
                    <span className="drop-zone-title">Destination Wallets</span>
                    <span className="drop-zone-count">{destinationWallets.length}</span>
                  </div>
                  {destinationWallets.length > 0 && (
                    <>
                      <button
                        className="clear-zone-button"
                        onClick={() => setDestinationWallets([])}
                      >
                        Clear
                      </button>
                      <button
                        className="clear-zone-button"
                        onClick={handleSendBackToMain}
                        disabled={isVaultDepositSigning || destinationWallets.length === 0}
                        style={{ marginLeft: '8px' }}
                      >
                        {isVaultDepositSigning ? 'Sending...' : 'Send Back to Main'}
                      </button>
                    </>
                  )}
                  <div className="custom-address-section">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="custom-address-input"
                        value={customDestinationAddress}
                        onChange={(e) => {
                          setCustomDestinationAddress(e.target.value);
                          setCustomAddressError('');
                        }}
                        placeholder="0x..."
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                      {customAddressError && (
                        <div style={{
                          color: '#ff6b6b',
                          fontSize: '0.7rem',
                          marginTop: '2px'
                        }}>
                          {customAddressError}
                        </div>
                      )}
                    </div>
                    <button
                      className="deposit-max-button"
                      onClick={handleAddCustomAddress}
                      disabled={!customDestinationAddress.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {renderWalletContainer(
                  destinationWallets,
                  'destination',
                  'destination-wallets',
                  'Drag destination wallets here',
                  destinationWalletsRef
                )}
              </div>
            </div>
            {(sourceWallets.length > 0 || destinationWallets.length > 0) && (
              <div className="distribution-controls">
                <div className="distribution-settings">
                  <div className="distribution-amount-section">
                    <label className="distribution-label">Amount to Distribute (MON):</label>
                    <div className="distribution-amount-input-container">
                      <input
                        type="text"
                        className="distribution-amount-input"
                        value={distributionAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d{0,18}$/.test(value)) {
                            setDistributionAmount(value);
                          }
                        }}
                        placeholder="0.00"
                      />
                      <button
                        className="deposit-max-button"
                        onClick={handleMaxAmount}
                        disabled={sourceWallets.length === 0}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <div className="distribution-mode-section">
                    <label className="distribution-label">Distribution Mode:</label>
                    <select
                      className="distribution-mode-select"
                      value={distributionMode}
                      onChange={(e) => setDistributionMode(e.target.value as 'equal' | 'proportional')}
                    >
                      <option value="equal">Equal Distribution</option>
                      <option value="proportional">Proportional by Balance</option>
                    </select>
                  </div>

                  <div className="distribution-actions">
                    <button
                      className="clear-all-button"
                      onClick={clearAllZones}
                    >
                      Clear All
                    </button>
                    <button
                      className="execute-distribution-button"
                      onClick={executeDistribution}
                      disabled={
                        sourceWallets.length === 0 ||
                        destinationWallets.length === 0 ||
                        !distributionAmount ||
                        parseFloat(distributionAmount) <= 0 ||
                        isVaultDepositSigning
                      }
                    >
                      {isVaultDepositSigning ? 'Distributing...' : 'Execute Distribution'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showImportModal && (
              <div className="pk-modal-backdrop" onClick={closeImportModal}>
                <div className="pk-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pk-modal-header">
                    <h3 className="pk-modal-title">Import Wallet</h3>
                    <button className="pk-modal-close" onClick={closeImportModal}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="pk-modal-content">
                    <div className="pk-input-section">
                      <label className="pk-label">Private Key:</label>
                      <div className="pk-input-container">
                        <input
                          type="text"
                          className="pk-input"
                          value={importPrivateKey}
                          onChange={(e) => {
                            setImportPrivateKey(e.target.value);
                            setImportError('');
                          }}
                          placeholder="0x... or without 0x prefix"
                          autoComplete="off"
                          spellCheck="false"
                        />
                        {importError && (
                          <div className="pk-error-message">
                            {importError}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pk-modal-actions">
                      <button
                        className={`pk-confirm-button ${isImporting ? 'loading' : ''}`}
                        onClick={handleImportWallet}
                        disabled={!importPrivateKey.trim() || isImporting}
                      >
                        {isImporting ? 'Importing...' : 'Import Wallet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showExportModal && exportingWallet && (
              <div className="export-private-key-modal-backdrop" onClick={closeExportModal}>
                <div className="export-private-key-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="export-private-key-modal-header">
                    <h3 className="export-private-key-modal-title">Export Private Key</h3>
                    <button className="export-private-key-modal-close" onClick={closeExportModal}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="export-private-key-modal-content">
                    <div className="export-private-key-warning">
                      <div className="export-private-key-warning-text">
                        Never share your private key with anyone. Anyone with access to your private key can control your wallet and steal your funds.
                      </div>
                    </div>

                    <div className="export-private-key-wallet-info">
                      <div className="export-private-key-info-row">
                        <span className="export-private-key-label">Address:</span>
                        <span className="export-private-key-value">{exportingWallet.address.slice(0, 6)}...{exportingWallet.address.slice(-4)}</span>
                      </div>
                      <div className="export-private-key-info-row">
                        <span className="export-private-key-label">Name:</span>
                        <span className="export-private-key-value">
                          {getWalletName(exportingWallet.address, subWallets.findIndex(w => w.address === exportingWallet.address))}
                        </span>
                      </div>
                    </div>

                    <div className="export-private-key-section">
                      <label className="export-private-key-pk-label">Private Key:</label>
                      <div className="export-private-key-container">
                        {!privateKeyRevealed ? (
                          <div
                            className="export-private-key-reveal-button"
                            onClick={revealPrivateKey}
                          >
                            <span>Click to reveal private key</span>
                          </div>
                        ) : (
                          <>
                            <textarea
                              className="export-private-key-input"
                              value={exportingWallet.privateKey}
                              readOnly
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showDeleteConfirmation && (
              <div className="delete-confirmation-modal-backdrop" onClick={() => setShowDeleteConfirmation(false)}>
                <div className="delete-confirmation-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="delete-confirmation-modal-header">
                    <h3 className="delete-confirmation-modal-title">Delete Wallet</h3>
                    <button className="delete-confirmation-modal-close" onClick={() => setShowDeleteConfirmation(false)}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="delete-confirmation-modal-content">
                    <div className="delete-confirmation-warning">
                      <div className="delete-confirmation-warning-text">
                        <h4>Are you sure you want to delete this wallet?</h4>
                        <p>This action cannot be undone. The private key will not be recoverable unless you have it saved elsewhere.</p>
                      </div>
                    </div>
                    <div className="delete-confirmation-actions">
                      <button
                        className="delete-confirmation-confirm-button"
                        onClick={() => deleteWallet(walletToDelete)}
                      >
                        Delete Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showDepositModal && (
              <div className="pk-modal-backdrop" onClick={closeDepositModal}>
                <div className="pk-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pk-modal-header">
                    <h3 className="pk-modal-title">Deposit from Main Wallet</h3>
                    <button className="pk-modal-close" onClick={closeDepositModal}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="pk-modal-content">

                    <div className="main-wallet-balance-section">
                      <div className="main-wallet-balance-container">
                        <span className="main-wallet-balance-label">Available Balance:</span>
                        <div className="main-wallet-balance-value">
                          <img src={monadicon} className="main-wallet-balance-icon" alt="MON" />
                          <span className={`main-wallet-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                            {getMainWalletBalance().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pk-input-section">
                      <label className="pk-label">Amount (MON):</label>
                      <div className="pk-input-container">
                        <div className="deposit-amount-input-container">
                          <input
                            type="text"
                            className="pk-input"
                            value={depositAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d{0,18}$/.test(value)) {
                                setDepositAmount(value);
                              }
                            }}
                            placeholder="0.00"
                            autoComplete="off"
                          />
                          <button
                            className="deposit-main-max-button"
                            onClick={() => {
                              const maxBalance = getMainWalletBalance();
                              const maxDepositAmount = Math.max(0, maxBalance - 0.01);
                              setDepositAmount(maxDepositAmount.toFixed(2).toString());
                            }}
                            disabled={getMainWalletBalance() <= 0.001}
                          >
                            Max
                          </button>
                        </div>
                        {depositAmount && parseFloat(depositAmount) > getMainWalletBalance() && (
                          <div className="pk-error-message">
                            Insufficient balance. Available: {getMainWalletBalance().toFixed(4)} MON
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pk-modal-actions">
                      <button
                        className={`pk-confirm-button ${isDepositing ? 'loading' : ''}`}
                        onClick={handleDepositFromEOA}
                        disabled={
                          !depositAmount ||
                          parseFloat(depositAmount) <= 0 ||
                          parseFloat(depositAmount) > getMainWalletBalance() ||
                          isDepositing
                        }
                      >
                        {isDepositing ? '' : 'Deposit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'trenches':
        return (
          <div className="trenches-container">
            <div className="trenches-top-section">

              <div className="trenches-balance-section">
                <h3 className="trenches-balance-title">BALANCE</h3>
                <div>
                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Total Value</div>
                    <div className={`trenches-balance-value ${isBlurred ? 'blurred' : ''}`}>
                      $0
                    </div>
                  </div>
                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Unrealized PNL</div>
                    <div className={`trenches-balance-value-small ${isBlurred ? 'blurred' : ''}`}>
                      $0
                    </div>
                  </div>
                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Available Balance</div>
                    <div className={`trenches-balance-value-small ${isBlurred ? 'blurred' : ''}`}>
                      $0
                    </div>
                  </div>
                </div>
              </div>

              <div className="trenches-pnl-section">
                <div className="trenches-pnl-header">
                  <h3 className="trenches-pnl-title">REALIZED PNL</h3>
                  <button
                    className="trenches-pnl-calendar-button"
                    onClick={() => {
                      setPNLCalendarLoading(true);
                      setTimeout(() => {
                        setPNLCalendarLoading(false);
                        setShowPNLCalendar(true);
                      }, 2000);
                    }}
                  >
                    <svg fill="#cfcfdfff" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 64 64" width="18" height="18"><path d="M 8 8 L 8 20 L 56 20 L 56 8 L 46 8 L 46 9 C 46 10.657 44.657 12 43 12 C 41.343 12 40 10.657 40 9 L 40 8 L 24 8 L 24 9 C 24 10.657 22.657 12 21 12 C 19.343 12 18 10.657 18 9 L 18 8 L 8 8 z M 8 22 L 8 56 L 56 56 L 56 24 L 52 23.832031 L 52 45 C 52 47 47 47 47 47 C 47 47 47 52 44 52 L 12 52 L 12 22.167969 L 8 22 z M 19 29 L 19 35 L 25 35 L 25 29 L 19 29 z M 29 29 L 29 35 L 35 35 L 35 29 L 29 29 z M 39 29 L 39 35 L 45 35 L 45 29 L 39 29 z M 19 39 L 19 45 L 25 45 L 25 39 L 19 39 z M 29 39 L 29 45 L 35 45 L 35 39 L 29 39 z M 39 39 L 39 45 L 45 45 L 45 39 L 39 39 z"/></svg>
                  </button>
                </div>

                <div className="trenches-pnl-chart">
                  <div className="trenches-pnl-placeholder">
                    No trading data
                  </div>
                </div>
              </div>

              <div className="trenches-performance-section">
                <div className="trenches-performance-header">
                  <h3 className="trenches-performance-title">PERFORMANCE</h3>
                  <button
                    className="trenches-pnl-button"
                    onClick={() => setpopup(27)}
                  >
                    View PNL
                  </button></div>

                <div className="trenches-performance-stats">
                  <div className="trenches-performance-stat-row">
                    <span className="trenches-performance-stat-label">7d PNL</span>
                    <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      $0.00
                    </span>
                  </div>
                  <div className="trenches-performance-stat-row">
                    <span className="trenches-performance-stat-label">7d TXNS</span>
                    <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      0.0/0
                    </span>
                  </div>
                </div>

                <div className="trenches-performance-ranges">
                  {[
                    { label: '>500%', count: 0 },
                    { label: '200% - 500%', count: 0 },
                    { label: '0% - 200%', count: 0 },
                    { label: '0% - 140%', count: 0 },
                    { label: '<-50%', count: 0 }
                  ].map((range, index) => (
                    <div key={index} className="trenches-performance-range">
                      <span
                        className="trenches-performance-range-label"
                      >
                        {range.label}
                      </span>
                      <span className="trenches-performance-range-count">
                        {range.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="trenches-activity-section">
              <div className="trenches-activity-header">

                <div className="trenches-activity-tabs">
                  {[
                    { key: 'positions', label: 'Active Positions' },
                    { key: 'history', label: 'History' },
                    { key: 'top100', label: 'Top 100' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`trenches-activity-tab ${tab.key === 'positions' ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="trenches-activity-filters">
                  <input
                    type="text"
                    placeholder="Search by name or address"
                    className="trenches-search-input"
                  />
                </div>
              </div>

              <div className="trenches-table-header">
                <div>Spot</div>
                <div>Remaining</div>
                <div>Action</div>
                <div>Type</div>
                <div>Token</div>
                <div>Amount</div>
                <div>Market Cap</div>
                <div>Age</div>
                <div>Estimate</div>
              </div>

              <div className="trenches-table-content">
                <div className="trenches-empty-state">
                  <div className="trenches-empty-text">
                    No active positions
                    <br />
                    <span className="trenches-empty-subtext">
                      Start trading to see your positions here
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {pnlCalendarLoading && (
              <div className="pnl-calendar-backdrop">
                <div className="pnl-calendar-container">
                  <div className="pnl-calendar-header">
                    <div className="pnl-calendar-title-section">
                      <div className="skeleton-loading skeleton-title"></div>
                      <div className="pnl-calendar-nav">
                        <div className="skeleton-loading skeleton-nav-button"></div>
                        <div className="skeleton-loading skeleton-month"></div>
                        <div className="skeleton-loading skeleton-nav-button"></div>
                      </div>
                    </div>
                  </div>

                  <div className="pnl-calendar-gradient-bar">
                    <div className="skeleton-loading skeleton-gradient"></div>
                    <div className="pnl-calendar-gradient-labels">
                      <div className="skeleton-loading skeleton-label"></div>
                      <div className="skeleton-loading skeleton-label"></div>
                    </div>
                  </div>

                  <div className="pnl-calendar-content">
                    <div className="pnl-calendar-weekdays">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="pnl-calendar-weekday">{day}</div>
                      ))}
                    </div>

                    <div className="pnl-calendar-grid">
                      {Array.from({ length: 31 }, (_, i) => (
                        <div key={i + 1} className="pnl-calendar-day skeleton-day">
                          <div className="skeleton-loading skeleton-day-number"></div>
                          <div className="skeleton-loading skeleton-day-pnl"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pnl-calendar-footer">
                    <div className="pnl-calendar-stats">
                      <div className="skeleton-loading skeleton-stat"></div>
                      <div className="skeleton-loading skeleton-stat"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showPNLCalendar && (
              <div className="pnl-calendar-backdrop" onClick={() => setShowPNLCalendar(false)}>
                <div className="pnl-calendar-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pnl-calendar-header">
                    <div className="pnl-calendar-title-section">
                      <h3 className="pnl-calendar-title">PNL Calendar</h3>
                      <div className="pnl-calendar-nav">
                        <button className="pnl-calendar-nav-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="grey" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                        <span className="pnl-calendar-month">Aug 2025</span>
                        <button className="pnl-calendar-nav-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="grey" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className=""><path d="m9 18 6-6-6-6" /></svg></button>
                      </div>
                    </div>
                    <div className="pnl-calendar-controls">
                      <div className="pnl-calendar-total">
                      </div>
                      <button className="pnl-calendar-close" onClick={() => setShowPNLCalendar(false)}>
                        <img src={closebutton} className="close-button-icon" />
                      </button>
                    </div>
                  </div>

                  <div className="pnl-calendar-gradient-bar">
                    <span className="pnl-calendar-total-label">$0</span>

                    <div className="pnl-calendar-ratio-container">
                      <div className="pnl-calendar-ratio-buy"></div>
                      <div className="pnl-calendar-ratio-sell"></div>
                    </div>

                    <div className="pnl-calendar-gradient-labels">
                      <span><span className="pnl-buy-color">0</span> / <span className="pnl-buy-color">$0</span></span>
                      <span><span className="pnl-sell-color">0</span> / <span className="pnl-sell-color">$0</span></span>
                    </div>
                  </div>

                  <div className="pnl-calendar-content">
                    <div className="pnl-calendar-weekdays">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="pnl-calendar-weekday">{day}</div>
                      ))}
                    </div>

                    <div className="pnl-calendar-grid">
                      {Array.from({ length: 31 }, (_, i) => (
                        <div key={i + 1} className="pnl-calendar-day">
                          <div className="pnl-calendar-day-number">{i + 1}</div>
                          <div className="pnl-calendar-day-pnl">$0</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pnl-calendar-footer">
                    <div className="pnl-calendar-stats">
                      <span>Current Positive Streak: <strong>0d</strong></span>
                      <span>Best Positive Streak in Aug: <strong>0d</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (isMobile) {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'spot' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('spot')}
            >
              Spot
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'margin' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('margin')}
            >
              Margin
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
          </div>
          <div className="search-wallet-wrapper">
            <div className="portfolio-wallet-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search vaults..."
                className="portfolio-wallet-search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button
              className={`wallet-search-confirm-button ${isButtonDisabled ? 'disabled' : ''}`}
              onClick={isSpectating ? clearSpectating : handleConfirmSpectating}
              disabled={isButtonDisabled}
            >
              {isSpectating ? 'Stop Spectating' : 'Spectate'}
            </button>
          </div>
        </div>
        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );
  } else {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'spot' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('spot')}
            >
              Spot
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'margin' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('margin')}
            >
              Margin
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
          </div>
          <div className="search-wallet-wrapper">
            <button className="portfolio-selected-wallet">Main Wallet
              <img src={cheveron} className="portfolio-wallet-selector" />
            </button>
            <div className="portfolio-wallet-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search to track wallet..."
                className="portfolio-wallet-search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button
              className={`wallet-search-confirm-button ${isButtonDisabled ? 'disabled' : ''}`}
              onClick={isSpectating ? clearSpectating : handleConfirmSpectating}
              disabled={isButtonDisabled}
            >
              {isSpectating ? 'Stop Spectating' : 'Spectate'}
            </button>
          </div>
        </div>
        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );
  }
};

export default Portfolio;