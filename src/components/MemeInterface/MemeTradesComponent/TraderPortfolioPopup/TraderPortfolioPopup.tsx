import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';
import PortfolioGraph from '../../../Portfolio/PortfolioGraph/PortfolioGraph';
import BalancesContent from '../../../Portfolio/BalancesContent/BalancesContent';
import { usePortfolioData } from '../../../Portfolio/PortfolioGraph/usePortfolioData';
import { formatCommas } from '../../../../utils/numberDisplayFormat';
import { useSharedContext } from '../../../../contexts/SharedContext';
import './TraderPortfolioPopup.css';
import { settings } from '../../../../settings';

interface TraderPortfolioPopupProps {
    traderAddress: string;
    onClose: () => void;
    tokenList: any[];
    marketsData: any[];
    onMarketSelect?: (market: any) => void;
    setSendTokenIn?: (token: any) => void;
    setpopup?: (value: number) => void;
}

const TraderPortfolioPopup: React.FC<TraderPortfolioPopupProps> = ({
    traderAddress,
    onClose,
    tokenList,
    marketsData,
    onMarketSelect,
    setSendTokenIn,
    setpopup
}) => {
    const [totalAccountValue, setTotalAccountValue] = useState<number | null>(null);
    const [chartDays, setChartDays] = useState(7);
    const [isBlurred, _setIsBlurred] = useState(false);
    const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
    const [percentage, setPercentage] = useState(0);
    const [sortConfig, _setSortConfig] = useState({
        column: 'balance',
        direction: 'desc'
    });

    // Real blockchain token balances - starts empty, gets filled by fetchRealBalances
    const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});
    const [balancesLoading, setBalancesLoading] = useState(false);
    const { activechain } = useSharedContext();
    
    // Use your existing usePortfolioData hook for real blockchain data
    const portfolioData = usePortfolioData(
        traderAddress,
        tokenList,
        chartDays,
        tokenBalances,
        setTotalAccountValue,
        marketsData,
        false, // stateIsLoading
        true   // shouldFetchGraph
    );

    // Fetch real token balances from blockchain using your existing infrastructure
    useEffect(() => {
        const fetchRealBalances = async () => {
            if (!traderAddress || !tokenList.length) return;

            setBalancesLoading(true);

            try {
                // Use dynamic imports to load your existing blockchain infrastructure
                const { readContract } = await import('@wagmi/core');
                const { config } = await import('../../../../wagmi');
                const { CrystalDataHelperAbi } = await import('../../../../abis/CrystalDataHelperAbi');
                const { settings } = await import('../../../../settings');

                // Fetch current token balances using the same method as your Portfolio component
                const balancesData = await readContract(config, {
                    abi: CrystalDataHelperAbi,
                    address: settings.chainConfig[activechain].balancegetter,
                    functionName: 'batchBalanceOf',
                    args: [
                        traderAddress as `0x${string}`,
                        tokenList.map((token) => token.address as `0x${string}`),
                    ],
                });

                // Convert blockchain response to the format expected by your components
                const balances: { [key: string]: string } = {};
                for (const [index, balance] of balancesData.entries()) {
                    const token = tokenList[index];
                    if (token) {
                        balances[token.address] = balance.toString();
                    }
                }

                setTokenBalances(balances);

            } catch (error) {
                setTokenBalances({});
            } finally {
                setBalancesLoading(false);
            }
        };

        fetchRealBalances();
    }, [traderAddress, tokenList]);

    const handlePercentageChange = (value: number) => {
        setPercentage(value);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
        }
    };

    const shortenAddress = (address: string) => {
        return address;
    };

    const openEtherscan = () => {
        window.open(`${settings.chainConfig[activechain].explorer}/address/${traderAddress}`, '_blank');
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key to close popup
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);


    // Loading skeleton components
    const ValueSkeleton = () => (
        <div className="trader-skeleton trader-skeleton-value"></div>
    );

    const PercentageSkeleton = () => (
        <div className="trader-skeleton trader-skeleton-percentage"></div>
    );

    const AssetsLoadingSkeleton = () => (
        <div className="trader-loading-assets">
            {[...Array(4)].map((_, index) => (
                <div key={index} className="trader-loading-asset-row">
                    <div className="trader-skeleton trader-loading-asset-icon"></div>
                    <div className="trader-loading-asset-info">
                        <div className="trader-skeleton trader-loading-asset-name"></div>
                        <div className="trader-skeleton trader-loading-asset-symbol"></div>
                    </div>
                    <div className="trader-skeleton trader-loading-asset-balance"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="trader-popup-backdrop" onClick={handleBackdropClick}>
            <div className="trader-popup-container">
                {/* Header */}
                <div className="trader-popup-header">
                    <div className="trader-popup-title">
                        <div className="trader-address-container">
                            <span className="trader-address">{shortenAddress(traderAddress)}</span>
                            <button
                                className="trader-action-btn"
                                onClick={() => copyToClipboard(traderAddress)}
                                title="Copy Address"
                            >
                                <Copy size={11} />
                            </button>
                            <button
                                className="trader-action-btn"
                                onClick={openEtherscan}
                                title="View on Explorer"
                            >
                                <ExternalLink size={11} />
                            </button>
                        </div>
                    </div>
                    <button className="trader-popup-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="trader-popup-content">
                    <div className="trader-account-summary-container">
                        <div className={`trader-account-summary ${percentage >= 0 ? 'positive' : 'negative'}`}>
                            <span className="trader-balance-title">BALANCE</span>

                            <div className="trader-total-value">
                                <div className="trader-balance-row">
                                    <span className="trader-balance-label">Total Value</span>
                                    <span className={`trader-value ${isBlurred ? 'blurred' : ''}`}>
                                        {balancesLoading ? (
                                            <ValueSkeleton />
                                        ) : (
                                            `$${formatCommas(typeof totalAccountValue === 'number' ? totalAccountValue.toFixed(2) : '0.00')}`
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <div className="trader-balance-row">
                                        <span className="trader-balance-label">7d Change</span>
                                        <div className="trader-percentage-container">
                                            <span className={`trader-percentage ${isBlurred ? 'blurred' : ''} ${percentage >= 0 ? 'positive' : 'negative'}`}>
                                                {portfolioData.portChartLoading || balancesLoading ? (
                                                    <PercentageSkeleton />
                                                ) : (
                                                    `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="trader-balance-row">
                                    <span className="trader-balance-label">Available Balance</span>
                                    <span className={`trader-value ${isBlurred ? 'blurred' : ''}`}>
                                        {balancesLoading ? (
                                            <ValueSkeleton />
                                        ) : (
                                            `$${formatCommas(typeof totalAccountValue === 'number' ? totalAccountValue.toFixed(2) : '0.00')}`
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="trader-graph-container">
                            <span className="trader-graph-label">PNL</span>
                            <div className="trader-graph-wrapper">
                                <PortfolioGraph
                                    address={traderAddress}
                                    colorValue={portfolioColorValue}
                                    setColorValue={setPortfolioColorValue}
                                    isPopup={true}
                                    onPercentageChange={handlePercentageChange}
                                    chartData={portfolioData.chartData}
                                    portChartLoading={portfolioData.portChartLoading}
                                    chartDays={chartDays}
                                    setChartDays={setChartDays}
                                    isBlurred={isBlurred}
                                />
                            </div>
                        </div>
                        
                        <div className="trader-performance-container">
                            <div className="trader-performance-header">
                                <h4 className="trader-graph-label">PERFORMANCE</h4>
                                <div className="trader-performance-row">
                                    <span className="trader-performance-label">24h PNL</span>
                                    <span className="trader-performance-value positive">+$73.2</span>
                                </div>
                                <div className="trader-performance-row">
                                    <span className="trader-performance-label">24h Transactions</span>
                                    <span className="trader-performance-value">23
                                        <span className="trader-performance-value positive"> 12</span>
                                        <span> / </span>
                                        <span className="trader-performance-value negative">11</span>
                                    </span>
                                </div>
                                <div className="trader-performance-row">
                                    <span className="trader-performance-label">24h Volume</span>
                                    <span className="trader-performance-value">$32.1K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="trader-assets-container">
                        <div className="trader-assets-header">
                            <h4>Assets</h4>
                        </div>

                        <div className="trader-assets-list">
                            {balancesLoading ? (
                                <AssetsLoadingSkeleton />
                            ) : (
                                <BalancesContent
                                    tokenList={tokenList}
                                    onMarketSelect={onMarketSelect}
                                    setSendTokenIn={setSendTokenIn}
                                    setpopup={setpopup}
                                    sortConfig={sortConfig}
                                    tokenBalances={tokenBalances}
                                    marketsData={marketsData}
                                    isBlurred={isBlurred}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraderPortfolioPopup;