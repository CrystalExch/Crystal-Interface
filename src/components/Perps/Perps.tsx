import React, { useRef, useState, useEffect, useCallback } from 'react';
import ChartOrderbookPanel from '../ChartOrderbookPanel/ChartOrderbookPanel';
import OrderCenter from '../OrderCenter/OrderCenter';
import editicon from "../../assets/edit.svg";
import './Perps.css'

interface PerpsProps {
    layoutSettings: string;
    orderbookPosition: string;
    orderdata: any;
    windowWidth: any;
    mobileView: any;
    isOrderbookVisible: boolean;
    orderbookWidth: number;
    setOrderbookWidth: any;
    obInterval: number;
    amountsQuote: any;
    setAmountsQuote: any;
    obtrades: any;
    baseInterval: number;
    setOBInterval: any;
    viewMode: 'both' | 'buy' | 'sell';
    setViewMode: any;
    activeTab: 'orderbook' | 'trades';
    setActiveTab: any;
    updateLimitAmount: any;
    renderChartComponent: any;
    reserveQuote: any;
    reserveBase: any;
    orders: any[];
    tradehistory: any[];
    canceledorders: any[];
    router: any;
    address: any;
    currentMarket: string;
    orderCenterHeight: number;
    hideBalances?: boolean;
    tokenList: any[];
    onMarketSelect: (token: any) => void;
    setSendTokenIn: any;
    setpopup: (value: number) => void;
    hideMarketFilter?: boolean;
    sortConfig: any;
    onSort: (config: any) => void;
    tokenBalances: any;
    activeSection: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
    setActiveSection: any;
    filter: 'all' | 'buy' | 'sell';
    setFilter: any;
    onlyThisMarket: boolean;
    setOnlyThisMarket: any;
    isPortfolio?: boolean;
    refetch: any;
    sendUserOperationAsync: any;
    setChain: any;
    isBlurred?: boolean;
    isVertDragging?: boolean;
    isOrderCenterVisible?: boolean;
    onLimitPriceUpdate?: (price: number) => void;
    openEditOrderPopup: (order: any) => void;
    openEditOrderSizePopup: (order: any) => void;
    marketsData: any;
    tradesByMarket: any;
    activeMarketKey: any;
    wethticker: any;
    ethticker: any;
    memoizedTokenList: any;
    memoizedSortConfig: any;
    emptyFunction: any;
    handleSetChain: any;
    setCurrentLimitPrice: any;
    sliderIncrement?: number;
}

const Perps: React.FC<PerpsProps> = ({
    layoutSettings,
    orderbookPosition,
    orderdata,
    windowWidth,
    mobileView,
    isOrderbookVisible,
    orderbookWidth,
    setOrderbookWidth,
    obInterval,
    amountsQuote,
    setAmountsQuote,
    obtrades,
    baseInterval,
    setOBInterval,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    updateLimitAmount,
    renderChartComponent,
    reserveQuote,
    reserveBase,
    orders,
    tradehistory,
    canceledorders,
    router,
    address,
    currentMarket,
    orderCenterHeight,
    hideBalances = false,
    hideMarketFilter = false,
    tokenList,
    onMarketSelect,
    setSendTokenIn,
    setpopup,
    sortConfig,
    onSort,
    tokenBalances,
    activeSection,
    setActiveSection,
    filter,
    setFilter,
    onlyThisMarket,
    setOnlyThisMarket,
    isPortfolio,
    refetch,
    sendUserOperationAsync,
    setChain,
    isBlurred,
    isVertDragging,
    isOrderCenterVisible,
    onLimitPriceUpdate,
    openEditOrderPopup,
    openEditOrderSizePopup,
    marketsData,
    tradesByMarket,
    activeMarketKey,
    wethticker,
    ethticker,
    memoizedTokenList,
    memoizedSortConfig,
    emptyFunction,
    handleSetChain,
    setCurrentLimitPrice,
    sliderIncrement = 10,
}) => {

    const [roundedBuyOrders, setRoundedBuyOrders] = useState<{ orders: any[], key: string }>({ orders: [], key: '' });
    const [roundedSellOrders, setRoundedSellOrders] = useState<{ orders: any[], key: string }>({ orders: [], key: '' });
    const [activeTradeType, setActiveTradeType] = useState<"long" | "short">("long");
    const [activeOrderType, setActiveOrderType] = useState<"market" | "Limit" | "Pro">("market");

    // Slider-related state
    const [tradeAmount, setTradeAmount] = useState("");
    const [limitPrice, setLimitPrice] = useState("");
    const [sliderPercent, setSliderPercent] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPerpsPreset, setSelectedPerpsPreset] = useState<number | null>(null);
    const [isPresetEditMode, setIsPresetEditMode] = useState(false);
    const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
    const [tempPresetValue, setTempPresetValue] = useState('');

    // TP/SL state
    const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
    const [tpPrice, setTpPrice] = useState("");
    const [slPrice, setSlPrice] = useState("");
    const [tpPercent, setTpPercent] = useState("0.0");
    const [slPercent, setSlPercent] = useState("0.0");

    // Time in Force dropdown state
    const [timeInForce, setTimeInForce] = useState("GTC");
    const [isTifDropdownOpen, setIsTifDropdownOpen] = useState(false);

    // Sliding indicator state
    const [indicatorStyle, setIndicatorStyle] = useState<{
        width: number;
        left: number;
    }>({ width: 0, left: 0 });

    const [trades, setTrades] = useState<
        [boolean, string, number, string, string][]
    >([]);
    const [spreadData, setSpreadData] = useState<any>({});
    const [obTab, setOBTab] = useState<'orderbook' | 'trades'>(() => {
        const stored = localStorage.getItem('ob_active_tab');

        if (['orderbook', 'trades'].includes(stored ?? '')) {
            return stored as 'orderbook' | 'trades';
        }

        return mobileView === 'trades' ? 'trades' : 'orderbook';
    });
    const [isDragging2, setIsDragging2] = useState(false);

    // Refs
    const initialMousePosRef = useRef(0);
    const initialWidthRef = useRef(0);
    const widthRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const presetInputRef = useRef<HTMLInputElement>(null);

    // Order type button refs
    const marketButtonRef = useRef<HTMLButtonElement>(null);
    const limitButtonRef = useRef<HTMLButtonElement>(null);
    const proButtonRef = useRef<HTMLButtonElement>(null);
    const orderTypesContainerRef = useRef<HTMLDivElement>(null);

    // Update sliding indicator position
    const updateIndicatorPosition = useCallback(() => {
        const container = orderTypesContainerRef.current;
        if (!container) return;

        let activeButton: HTMLButtonElement | null = null;

        switch (activeOrderType) {
            case 'market':
                activeButton = marketButtonRef.current;
                break;
            case 'Limit':
                activeButton = limitButtonRef.current;
                break;
            case 'Pro':
                activeButton = proButtonRef.current;
                break;
        }

        if (activeButton) {
            const containerRect = container.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();

            const containerPadding = 13;
            const relativeLeft = buttonRect.left - containerRect.left - containerPadding;

            const indicatorWidth = buttonRect.width;
            const centeredLeft = relativeLeft + (buttonRect.width - indicatorWidth) / 2;

            setIndicatorStyle({
                width: indicatorWidth,
                left: centeredLeft
            });
        }
    }, [activeOrderType]);

    useEffect(() => {
        updateIndicatorPosition();

        const handleResize = () => {
            updateIndicatorPosition();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateIndicatorPosition]);

    // Focus preset input when editing
    useEffect(() => {
        if (editingPresetIndex !== null && presetInputRef.current) {
            presetInputRef.current.focus();
            presetInputRef.current.select();
        }
    }, [editingPresetIndex]);

    // Horizontal drag functionality for orderbook
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging2) return;

            e.preventDefault();
            e.stopPropagation();

            const mouseDelta = e.clientX - initialMousePosRef.current;
            const delta = orderbookPosition === 'left' ? mouseDelta : -mouseDelta;
            const newWidth = Math.max(
                250,
                Math.min(
                    widthRef.current
                        ? widthRef.current.getBoundingClientRect().width / 2
                        : 450,
                    initialWidthRef.current + delta,
                ),
            );

            setOrderbookWidth(newWidth);
            localStorage.setItem('orderbookWidth', newWidth.toString())
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDragging2) return;

            e.preventDefault();
            e.stopPropagation();
            setIsDragging2(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            const overlay = document.getElementById('global-drag-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        };

        if (isDragging2) {
            const overlay = document.createElement('div');
            overlay.id = 'global-drag-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '9999';
            overlay.style.cursor = 'col-resize';
            document.body.appendChild(overlay);

            window.addEventListener('mousemove', handleMouseMove, { capture: true });
            window.addEventListener('mouseup', handleMouseUp, { capture: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove, {
                capture: true,
            });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });

            const overlay = document.getElementById('global-drag-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        };
    }, [isDragging2, orderbookPosition]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        initialMousePosRef.current = e.clientX;
        initialWidthRef.current = orderbookWidth;
        setIsDragging2(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const orderBookStyle = {
        width: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
        minWidth: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
        transition: isDragging2 ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'hidden',
    };

    // Vertical drag functionality
    const [_isVertDragging, setIsVertDragging] = useState(false);
    const initialHeightRef = useRef(0);
    const handleVertMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        initialMousePosRef.current = e.clientY;
        initialHeightRef.current = orderCenterHeight;

        setIsVertDragging(true);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

    // Slider functionality
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
        const x = inputLeft + (percent / 100) * (inputRect.width - thumbW) + thumbW / 2;

        popup.style.left = `${x}px`;
        popup.style.transform = 'translateX(-50%)';
    }, []);

    const handlePresetEditToggle = useCallback(() => {
        setIsPresetEditMode(!isPresetEditMode);
        setEditingPresetIndex(null);
        setTempPresetValue('');
    }, [isPresetEditMode]);

    const handleSliderChange = useCallback((percent: number) => {
        setSliderPercent(percent);
        // You can add logic here to calculate trade amount based on balance and percentage
        // const calculatedAmount = (totalBalance * percent) / 100;
        // setTradeAmount(calculatedAmount.toString());
        positionPopup(percent);
    }, [positionPopup]);

    return (
        <div className="main-content-wrapper">
            <div className="chartandorderbookandordercenter">
                <div className="chartandorderbook">
                    <ChartOrderbookPanel
                        layoutSettings={layoutSettings}
                        orderbookPosition={orderbookPosition}
                        orderdata={{
                            roundedBuyOrders: roundedBuyOrders?.orders,
                            roundedSellOrders: roundedSellOrders?.orders,
                            spreadData,
                            priceFactor: Number(marketsData[roundedBuyOrders?.key]?.priceFactor),
                            marketType: marketsData[roundedBuyOrders?.key]?.marketType,
                            symbolIn: marketsData[roundedBuyOrders?.key]?.quoteAsset,
                            symbolOut: marketsData[roundedBuyOrders?.key]?.baseAsset,
                        }}
                        windowWidth={windowWidth}
                        mobileView={mobileView}
                        isOrderbookVisible={isOrderbookVisible}
                        orderbookWidth={orderbookWidth}
                        setOrderbookWidth={setOrderbookWidth}
                        obInterval={obInterval}
                        amountsQuote={amountsQuote}
                        setAmountsQuote={setAmountsQuote}
                        obtrades={trades}
                        setOBInterval={setOBInterval}
                        baseInterval={baseInterval}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        activeTab={obTab}
                        setActiveTab={setOBTab}
                        updateLimitAmount={updateLimitAmount}
                        renderChartComponent={renderChartComponent}
                        reserveQuote={reserveQuote}
                        reserveBase={reserveBase}
                    />
                </div>
                <div
                    className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
                >
                    <div
                        className="ordercenter-drag-handle"
                        onMouseDown={handleVertMouseDown}
                    />
                </div>
                <OrderCenter
                    orders={orders}
                    tradehistory={tradehistory}
                    canceledorders={canceledorders}
                    router={router}
                    address={address}
                    trades={tradesByMarket}
                    currentMarket={
                        activeMarketKey.replace(
                            new RegExp(
                                `^${wethticker}|${wethticker}$`,
                                'g'
                            ),
                            ethticker
                        )
                    }
                    orderCenterHeight={orderCenterHeight}
                    hideBalances={true}
                    tokenList={memoizedTokenList}
                    onMarketSelect={onMarketSelect}
                    setSendTokenIn={setSendTokenIn}
                    setpopup={setpopup}
                    sortConfig={memoizedSortConfig}
                    onSort={emptyFunction}
                    tokenBalances={tokenBalances}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    filter={filter}
                    setFilter={setFilter}
                    onlyThisMarket={onlyThisMarket}
                    setOnlyThisMarket={setOnlyThisMarket}
                    refetch={refetch}
                    sendUserOperationAsync={sendUserOperationAsync}
                    setChain={handleSetChain}
                    isVertDragging={isVertDragging}
                    isOrderCenterVisible={isOrderCenterVisible}
                    onLimitPriceUpdate={setCurrentLimitPrice}
                    openEditOrderPopup={openEditOrderPopup}
                    openEditOrderSizePopup={openEditOrderSizePopup}
                    marketsData={marketsData}
                    isPerps={true}
                />
            </div>
            <div className="perps-trade-modal">
                <div className="perps-top-section">
                    <div className="perps-order-types-wrapper">
                        <div className="perps-order-types" ref={orderTypesContainerRef}>
                            <button
                                ref={marketButtonRef}
                                className={`perps-order-type-button ${activeOrderType === "market" ? "active" : "inactive"}`}
                                onClick={() => setActiveOrderType("market")}
                            >
                                Market
                            </button>
                            <button
                                ref={limitButtonRef}
                                className={`perps-order-type-button ${activeOrderType === "Limit" ? "active" : "inactive"}`}
                                onClick={() => setActiveOrderType("Limit")}
                            >
                                Limit
                            </button>
                            <button
                                ref={proButtonRef}
                                className={`perps-order-type-button ${activeOrderType === "Pro" ? "active" : "inactive"}`}
                                onClick={() => setActiveOrderType("Pro")}
                            >
                                Pro
                            </button>
                            <div
                                className="perps-sliding-tab-indicator"
                                style={{
                                    width: `${indicatorStyle.width}px`,
                                    transform: `translateX(${indicatorStyle.left}px)`
                                }}
                            />
                        </div>
                    </div>
                    <div className="perps-buy-sell-container">
                        <button
                            className={`perps-long-button ${activeTradeType === "long" ? "active" : "inactive"}`}
                            onClick={() => setActiveTradeType("long")}
                        >
                            Long
                        </button>
                        <button
                            className={`perps-short-button ${activeTradeType === "short" ? "active" : "inactive"}`}
                            onClick={() => setActiveTradeType("short")}
                        >
                            Short
                        </button>
                    </div>
                    <div className="perps-amount-section">
                          {activeOrderType === "Limit" && (
                            <div className="perps-trade-input-wrapper">
                                Price 
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={limitPrice}
                                    onChange={(e) => setLimitPrice(e.target.value)}
                                    className="perps-trade-input"
                                />
                                <span className="perps-mid-button">
                                Mid
                                </span>
                            </div>
                        )}
                        <div className="perps-trade-input-wrapper">
                            Size
                            <input
                                type="number"
                                placeholder="0"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                className="perps-trade-input"
                            />
                            USD
                        </div>

                      

                        <div className="perps-balance-slider-wrapper">
                            <div className="perps-slider-container perps-slider-mode">
                                <input
                                    ref={sliderRef}
                                    type="range"
                                    className={`perps-balance-amount-slider ${isDragging ? "dragging" : ""}`}
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={sliderPercent}
                                    onChange={(e) => {
                                        const percent = parseInt(e.target.value);
                                        handleSliderChange(percent);
                                    }}
                                    onMouseDown={() => {
                                        setIsDragging(true);
                                        positionPopup(sliderPercent);
                                    }}
                                    onMouseUp={() => setIsDragging(false)}
                                    style={{
                                        background: `linear-gradient(to right, ${activeTradeType === 'long' ? '#aaaecf' : 'rgb(235, 112, 112)'
                                            } ${sliderPercent}%, rgb(28, 28, 31) ${sliderPercent}%)`,
                                    }}
                                />
                                <div
                                    ref={popupRef}
                                    className={`perps-slider-percentage-popup ${isDragging ? "visible" : ""}`}
                                >
                                    {sliderPercent}%
                                </div>

                                <div className="perps-balance-slider-marks">
                                    {[0, 25, 50, 75, 100].map((markPercent) => (
                                        <span
                                            key={markPercent}
                                            className={`perps-balance-slider-mark ${activeTradeType}`}
                                            data-active={sliderPercent >= markPercent}
                                            data-percentage={markPercent}
                                            onClick={() => handleSliderChange(markPercent)}
                                        >
                                            {markPercent}%
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="perps-tpsl-section">
                        <div className="perps-tpsl-header">
                            <div className="">
                                <label className="perps-tpsl-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        checked={isTpSlEnabled}
                                        onChange={(e) => setIsTpSlEnabled(e.target.checked)}
                                        className="perps-tpsl-checkbox"
                                    />
                                    <span className="perps-tpsl-label">Reduce Only</span>
                                </label>
                                <label className="perps-tpsl-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        checked={isTpSlEnabled}
                                        onChange={(e) => setIsTpSlEnabled(e.target.checked)}
                                        className="perps-tpsl-checkbox"
                                    />
                                    <span className="perps-tpsl-label">TP/SL</span>
                                </label>
                            </div>
                            <div className="perps-tif-dropdown">
                                <button
                                    className="perps-tif-button"
                                    onClick={() => setIsTifDropdownOpen(!isTifDropdownOpen)}
                                >
                                    <span className="perps-tif-label">TIF</span>
                                    <span className="perps-tif-value">{timeInForce}</span>
                                    <span className="perps-tif-arrow">^</span>
                                </button>

                                {isTifDropdownOpen && (
                                    <div className="perps-tif-dropdown-menu">
                                        {['GTC', 'IOC', 'ALO', '%'].map((option) => (
                                            <div
                                                key={option}
                                                className="perps-tif-option"
                                                onClick={() => {
                                                    setTimeInForce(option);
                                                    setIsTifDropdownOpen(false);
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isTpSlEnabled && (
                            <div className="perps-tpsl-content">
                                <div className="perps-tpsl-row">
                                    <div className="perps-tpsl-label-section">
                                        <span className="perps-tpsl-row-label">TP Price</span>
                                    </div>
                                    <div className="perps-tpsl-input-section">
                                        <input
                                            type="number"
                                            placeholder="Enter TP price"
                                            value={tpPrice}
                                            onChange={(e) => setTpPrice(e.target.value)}
                                            className="perps-tpsl-price-input"
                                        />
                                        <div className="perps-tpsl-percentage">
                                            <input
                                                type="number"
                                                value={tpPercent}
                                                onChange={(e) => setTpPercent(e.target.value)}
                                                className="perps-tpsl-percent-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="perps-tpsl-row">
                                    <div className="perps-tpsl-label-section">
                                        <span className="perps-tpsl-row-label">SL Price</span>
                                    </div>
                                    <div className="perps-tpsl-input-section">
                                        <input
                                            type="number"
                                            placeholder="Enter SL price"
                                            value={slPrice}
                                            onChange={(e) => setSlPrice(e.target.value)}
                                            className="perps-tpsl-price-input"
                                        />
                                        <div className="perps-tpsl-percentage">
                                            <input
                                                type="number"
                                                value={slPercent}
                                                onChange={(e) => setSlPercent(e.target.value)}
                                                className="perps-tpsl-percent-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        className={`perps-trade-action-button ${activeTradeType}`}
                        onClick={() => {
                            console.log(`Executing ${activeTradeType} trade for ${tradeAmount}`);
                            if (isTpSlEnabled) {
                                console.log(`TP Price: ${tpPrice}, SL Price: ${slPrice}`);
                            }
                        }}
                    >
                        {activeOrderType === "market"
                            ? `${activeTradeType === "long" ? "Long" : "Short"} Market`
                            : `Set ${activeTradeType === "long" ? "Long" : "Short"} Limit`
                        }
                    </button>
                </div>
                <div
                    className="perps-account-details"
                    style={{ height: `${orderCenterHeight + 100}px` }}
                >
                    <span className="perps-account-section-title" >Account Overview</span>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Balance
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Unrealized PNL
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Cross Margin Ratio
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Maintenance Margin
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Cross Account Leverage
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Perps;