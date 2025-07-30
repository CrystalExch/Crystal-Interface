import { Eye, Search, Eye as EyeIcon, Edit2, Check, X, Star } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
  subwalletBalanceLoading,
  refreshWalletBalance,
  forceRefreshAllWallets,
  setOneCTSigner,
  isVaultDepositSigning,
  setIsVaultDepositSigning,
  handleSetChain,
  handleSubwalletTransfer,
  createSubWallet,
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
  const [depositMode, setDepositMode] = useState<'main' | 'subwallet'>('main');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositFromWallet, setDepositFromWallet] = useState<string>('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingWallet, setExportingWallet] = useState<{ address: string, privateKey: string } | null>(null);

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
  const handleDragStart = (e: React.DragEvent, wallet: { address: string, privateKey: string }, index: number) => {
    const dragData: WalletDragItem = {
      address: wallet.address,
      name: getWalletName(wallet.address, index),
      balance: getWalletBalance(wallet.address),
      totalValue: getTotalWalletValue(wallet.address),
      index
    };

    setDraggedWallet(dragData);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };


  const handleDragOver = (e: React.DragEvent, zone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    if (zone === 'main') {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
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


  const handleDragStartFromZone = (e: React.DragEvent, wallet: WalletDragItem, zone: 'source' | 'destination') => {
    setDraggedWallet({ ...wallet, sourceZone: zone });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...wallet, sourceZone: zone }));
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



  const handleDropOnMain = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedWallet) return;

    if (draggedWallet.sourceZone) {
      if (draggedWallet.sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
      } else {
        setDestinationWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
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

      let amountPerDestination: number;
      if (distributionMode === 'equal') {
        amountPerDestination = amount / destinationWallets.length;
      } else {
        const totalDestinationValue = destinationWallets.reduce((sum, w) => sum + w.totalValue, 0);
        amountPerDestination = amount; 
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

      alert('Distribution completed successfully!');
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
        console.error('Required wallet functions not available');
        alert('Wallet creation functionality not available');
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
            version: 'Crystal v0.0.1 Testnet',
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

      console.log('New Portfolio Subwallet Created:', { address: walletAddress, privateKey: '***' });
    } catch (error) {
      console.error('Error creating portfolio subwallet:', error);
      alert('Failed to create subwallet. Please try again.');
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

  const copyPrivateKey = () => {
    if (exportingWallet) {
      navigator.clipboard.writeText(exportingWallet.privateKey);
      alert('Private key copied to clipboard!');
    }
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

  const toggleWalletEnabled = (address: string) => {
    const newEnabledWallets = new Set(enabledWallets);
    if (newEnabledWallets.has(address)) {
      newEnabledWallets.delete(address);
    } else {
      newEnabledWallets.add(address);
    }
    setEnabledWallets(newEnabledWallets);
    localStorage.setItem('crystal_enabled_wallets', JSON.stringify(Array.from(newEnabledWallets)));
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

  const openDepositModal = (targetWallet: string, mode: 'main' | 'subwallet') => {
    setDepositTargetWallet(targetWallet);
    setDepositMode(mode);
    setDepositAmount('');
    setDepositFromWallet('');
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setDepositTargetWallet('');
    setDepositAmount('');
    setDepositFromWallet('');
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositTargetWallet) return;

    try {
      setIsVaultDepositSigning(true);
      await handleSetChain();

      const ethAmount = BigInt(Math.round(parseFloat(depositAmount) * 1e18));

      if (depositMode === 'main') {
        const hash = await sendUserOperationAsync({
          uo: {
            target: depositTargetWallet as `0x${string}`,
            value: ethAmount,
            data: '0x'
          }
        });

        console.log('Deposit successful:', hash);

        await refreshWalletBalance(depositTargetWallet);
        refetch();

      } else if (depositMode === 'subwallet' && depositFromWallet) {
        const sourceWallet = subWallets.find(w => w.address === depositFromWallet);
        if (sourceWallet) {
          await handleSubwalletTransfer(depositFromWallet, depositTargetWallet, depositAmount, sourceWallet.privateKey);
        } else {
          throw new Error('Source wallet not found');
        }
      }

      closeDepositModal();

    } catch (error) {
      console.error('Deposit failed:', error);
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
              tokenList={tokenList}
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
                      {isSpectating ? "Spectating Performance" : "Performance"}
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
                    "Account"
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
                    {isSpectating ? "Spectated Trading Stats" : "Trading Stats"}
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
                        `$${formatCommas(getActiveAddress() ? low.toFixed(2) : '0.00')}`
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
                        `$${subWallets.reduce((total, wallet) => total + getTotalWalletValue(wallet.address), 0).toFixed(2)}`
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
                    <p>Create sub wallets to manage multiple wallets from one interface.</p>
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
                  <div
                    className={`drag-wallets-list ${dragOverZone === 'main' ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'main')}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropOnMain}
                  >
                    {subWallets
                      .filter(wallet =>
                        !sourceWallets.some(w => w.address === wallet.address) &&
                        !destinationWallets.some(w => w.address === wallet.address)
                      )
                      .map((wallet, index) => (
                        <div
                          key={wallet.address}
                          className="draggable-wallet-item"
                          draggable
                          onDragStart={(e) => handleDragStart(e, wallet, index)}
                        >
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
                                <div
                                  className="wallet-name-display"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('.wallet-name-edit-icon') as HTMLElement;
                                    if (icon) icon.style.opacity = '1';
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('.wallet-name-edit-icon') as HTMLElement;
                                    if (icon) icon.style.opacity = '0';
                                  }}
                                >
                                  <span
                                    className={`wallet-drag-name ${isWalletActive(wallet.privateKey) ? 'active' : ''}`}
                                    style={{
                                      color: isWalletActive(wallet.privateKey) ? '#d8dcff' : '#fff'
                                    }}
                                  >
                                    {getWalletName(wallet.address, subWallets.findIndex(w => w.address === wallet.address))}
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
                              <img src={copy} className="wallets-copy-icon" alt="Copy" />
                            </div>
                          </div>

                          <div className="wallet-drag-actions">
                            <button
                              className={`wallet-action-button ${isWalletActive(wallet.privateKey) ? 'primary' : ''}`}
                              onClick={() => {
                                setOneCTSigner(wallet.privateKey);
                                setpopup(25);
                                refetch();
                              }}

                            >
                              <Star
                                size={14}
                                fill={isWalletActive(wallet.privateKey) ? '#aaaecf' : 'none'}
                                color={isWalletActive(wallet.privateKey) ? '#0f0f12' : 'currentColor'}
                              />
                            </button>

                            <button
                              className="wallet-icon-button key-button"
                              onClick={() => openExportModal(wallet)}
                              title="Export Private Key"
                            >
                              <img src={key} className="wallet-action-icon" alt="Export Key" />
                            </button>

                            <a
                              href={`https://testnet.monadexplorer.com/address/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wallet-icon-button explorer-button"
                              title="View on Explorer"
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

                            <button
                              className="wallet-icon-button delete-button"
                              onClick={() => confirmDeleteWallet(wallet.address)}
                              title="Delete Wallet"
                            >
                              <img src={trash} className="wallet-action-icon" alt="Delete Wallet" />
                            </button>
                          </div>
                          <div className="wallet-drag-values">
                            <div className={`wallet-drag-balance ${isBlurred ? 'blurred' : ''}`}>
                              <img src={monadicon} className="wallet-drag-balance-mon-icon" alt="MON" />{getWalletBalance(wallet.address).toFixed(2)}
                            </div>

                          </div>

                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="wallets-right-panel">
              <div
                className={`drop-zone source-zone ${dragOverZone === 'source' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'source')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (draggedWallet?.sourceZone) {
                    handleDropBetweenZones(e, 'source');
                  } else {
                    handleDrop(e, 'source');
                  }
                }}
              >
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

                {sourceWallets.length === 0 ? (
                  <div className="drop-zone-empty">
                    <div className="drop-zone-icon">
                      <svg
                        className="wallets-drop-icon"
                        viewBox="0 0 24 24"
                        width="40"
                        height="40"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="7 11 12 16 17 11"></polyline>
                        <line x1="12" y1="1" x2="12" y2="14"></line>
                        <path d="M22 14V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V14" />
                      </svg>
                    </div>
                    <div className="drop-zone-text">Drag source wallets here</div>
                  </div>
                ) : (
                  <div className="drop-zone-wallets">
                    {sourceWallets.map((wallet) => (
                      <div
                        key={wallet.address}
                        className="draggable-wallet-item"
                        draggable
                        onDragStart={(e) => handleDragStartFromZone(e, wallet, 'source')}
                      >
                        <div className="wallet-drag-info">
                          <div className="wallet-name-container">
                            <div className="wallet-name-display">
                              <div className="wallet-name-display">
                                <span
                                  className={`wallet-drag-name ${(() => {
                                    const originalWallet = subWallets.find(w => w.address === wallet.address);
                                    return originalWallet && isWalletActive(originalWallet.privateKey) ? 'active' : '';
                                  })()}`}
                                  style={{
                                    color: (() => {
                                      const originalWallet = subWallets.find(w => w.address === wallet.address);
                                      return originalWallet && isWalletActive(originalWallet.privateKey) ? '#d8dcff' : '#fff';
                                    })()
                                  }}
                                >
                                  {wallet.name}
                                </span>
                              </div>                            </div>
                            <div className="wallet-drag-address">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                              <img src={copy} className="wallets-copy-icon" alt="Copy" />
                            </div>
                          </div>
                        </div>


                        <div className="wallet-drag-actions">
                          <button
                            className={`wallet-action-button ${(() => {
                              const originalWallet = subWallets.find(w => w.address === wallet.address);
                              return originalWallet && isWalletActive(originalWallet.privateKey) ? 'primary' : '';
                            })()}`}
                            onClick={() => {
                              const originalWallet = subWallets.find(w => w.address === wallet.address);
                              if (originalWallet) {
                                setOneCTSigner(originalWallet.privateKey);
                                setpopup(25);
                                refetch();
                              }
                            }}
                          >
                            <Star
                              size={14}
                              fill={(() => {
                                const originalWallet = subWallets.find(w => w.address === wallet.address);
                                return originalWallet && isWalletActive(originalWallet.privateKey) ? '#aaaecf' : 'none';
                              })()}
                              color={(() => {
                                const originalWallet = subWallets.find(w => w.address === wallet.address);
                                return originalWallet && isWalletActive(originalWallet.privateKey) ? '#0f0f12' : 'currentColor';
                              })()}
                            />
                          </button>

                          <button
                            className="wallet-icon-button key-button"
                            onClick={() => {
                              const originalWallet = subWallets.find(w => w.address === wallet.address);
                              if (originalWallet) openExportModal(originalWallet);
                            }}
                            title="Export Private Key"
                          >
                            <img src={key} className="wallet-action-icon" alt="Export Key" />
                          </button>

                          <a
                            href={`https://testnet.monadexplorer.com/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wallet-icon-button explorer-button"
                            title="View on Explorer"
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

                          <button
                            className="wallet-icon-button delete-button"
                            onClick={() => {
                              const originalWallet = subWallets.find(w => w.address === wallet.address);
                              if (originalWallet) confirmDeleteWallet(originalWallet.address);
                            }}
                            title="Delete Wallet"
                          >
                            <img src={trash} className="wallet-action-icon" alt="Delete Wallet" />
                          </button>
                        </div>

                        <div className="wallet-drag-values">
                          <div className={`wallet-drag-balance ${isBlurred ? 'blurred' : ''}`}>
                            <img src={monadicon} className="wallet-drag-balance-mon-icon" alt="MON" />
                            {wallet.balance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`drop-zone destination-zone ${dragOverZone === 'destination' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'destination')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  if (draggedWallet?.sourceZone) {
                    handleDropBetweenZones(e, 'destination');
                  } else {
                    handleDrop(e, 'destination');
                  }
                }}
              >
                <div className="drop-zone-header2">
                  <span className="drop-zone-title">Destination Wallets</span>
                  <span className="drop-zone-count">{destinationWallets.length}</span>
                  {destinationWallets.length > 0 && (
                    <button
                      className="clear-zone-button"
                      onClick={() => setDestinationWallets([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {destinationWallets.length === 0 ? (
                  <div className="drop-zone-empty">
                    <div className="drop-zone-icon">
                      <svg
                        className="wallets-drop-icon"
                        viewBox="0 0 24 24"
                        width="40"
                        height="40"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="7 11 12 16 17 11"></polyline>
                        <line x1="12" y1="1" x2="12" y2="14"></line>
                        <path d="M22 14V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V14" />
                      </svg>
                    </div>
                    <div className="drop-zone-text">Drag destination wallets here</div>
                  </div>
                ) : (
                  <div className="drop-zone-wallets">

                    {destinationWallets.length === 0 ? (
                      <div className="drop-zone-empty">
                        <div className="drop-zone-icon">
                          <svg
                            className="wallets-drop-icon"
                            viewBox="0 0 24 24"
                            width="40"
                            height="40"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="7 11 12 16 17 11"></polyline>
                            <line x1="12" y1="1" x2="12" y2="14"></line>
                            <path d="M22 14V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V14" />
                          </svg>
                        </div>
                        <div className="drop-zone-text">Drag destination wallets here</div>
                      </div>
                    ) : (
                      <div className="drop-zone-wallets">
                        {destinationWallets.map((wallet) => (
                          <div
                            key={wallet.address}
                            className="draggable-wallet-item"
                            draggable
                            onDragStart={(e) => handleDragStartFromZone(e, wallet, 'destination')}
                          >
                            <div className="wallet-drag-info">
                              <div className="wallet-name-container">
                                <div className="wallet-name-display">
                                  <div className="wallet-name-display">
                                    <span
                                      className={`wallet-drag-name ${(() => {
                                        const originalWallet = subWallets.find(w => w.address === wallet.address);
                                        return originalWallet && isWalletActive(originalWallet.privateKey) ? 'active' : '';
                                      })()}`}
                                      style={{
                                        color: (() => {
                                          const originalWallet = subWallets.find(w => w.address === wallet.address);
                                          return originalWallet && isWalletActive(originalWallet.privateKey) ? '#d8dcff' : '#fff';
                                        })()
                                      }}
                                    >
                                      {wallet.name}
                                    </span>
                                  </div>                                </div>
                                <div className="wallet-drag-address">
                                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                  <img src={copy} className="wallets-copy-icon" alt="Copy" />
                                </div>
                              </div>
                            </div>


                            <div className="wallet-drag-actions">
                              <button
                                className={`wallet-action-button ${(() => {
                                  const originalWallet = subWallets.find(w => w.address === wallet.address);
                                  return originalWallet && isWalletActive(originalWallet.privateKey) ? 'primary' : '';
                                })()}`}
                                onClick={() => {
                                  const originalWallet = subWallets.find(w => w.address === wallet.address);
                                  if (originalWallet) {
                                    setOneCTSigner(originalWallet.privateKey);
                                    setpopup(25);
                                    refetch();
                                  }
                                }}
                              >
                                <Star
                                  size={14}
                                  fill={(() => {
                                    const originalWallet = subWallets.find(w => w.address === wallet.address);
                                    return originalWallet && isWalletActive(originalWallet.privateKey) ? '#aaaecf' : 'none';
                                  })()}
                                  color={(() => {
                                    const originalWallet = subWallets.find(w => w.address === wallet.address);
                                    return originalWallet && isWalletActive(originalWallet.privateKey) ? '#0f0f12' : 'currentColor';
                                  })()}
                                />
                              </button>

                              <button
                                className="wallet-icon-button key-button"
                                onClick={() => {
                                  const originalWallet = subWallets.find(w => w.address === wallet.address);
                                  if (originalWallet) openExportModal(originalWallet);
                                }}
                                title="Export Private Key"
                              >
                                <img src={key} className="wallet-action-icon" alt="Export Key" />
                              </button>

                              <a
                                href={`https://testnet.monadexplorer.com/address/${wallet.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wallet-icon-button explorer-button"
                                title="View on Explorer"
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

                              <button
                                className="wallet-icon-button delete-button"
                                onClick={() => {
                                  const originalWallet = subWallets.find(w => w.address === wallet.address);
                                  if (originalWallet) confirmDeleteWallet(originalWallet.address);
                                }}
                                title="Delete Wallet"
                              >
                                <img src={trash} className="wallet-action-icon" alt="Delete Wallet" />
                              </button>
                            </div>

                            <div className="wallet-drag-values">
                              <div className={`wallet-drag-balance ${isBlurred ? 'blurred' : ''}`}>
                                <img src={monadicon} className="wallet-drag-balance-mon-icon" alt="MON" />
                                {wallet.balance.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {(sourceWallets.length > 0 || destinationWallets.length > 0) && (
              <div className="distribution-controls">
                <div className="distribution-settings">
                  <div className="distribution-amount-section">
                    <label className="distribution-label">Amount to Distribute (MON):</label>
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