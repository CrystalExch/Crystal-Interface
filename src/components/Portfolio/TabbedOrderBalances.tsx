import React from 'react';

import OrderCenter from '../OrderCenter/OrderCenter';

interface Trade {
  [key: string]: any;
}

interface TradesByMarket {
  [key: string]: Trade[];
}

interface TokenType {
  ticker: string;
  name: string;
  address: string;
  decimals: bigint;
  image: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface TabbedOrderBalancesProps {
  orders: any[];
  tradehistory: any[];
  canceledorders: any[];
  router: any;
  address: string | undefined;
  trades: TradesByMarket;
  tokenList: TokenType[];
  setTokenIn: (token: any) => void;
  setTokenOut: (token: any) => void;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  tokenBalances: {
    [key: string]: bigint;
  };
  orderCenterHeight: number;
  activeSection: 'orders' | 'tradeHistory' | 'orderHistory' | 'balances';
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  refetch: any;
}

const TabbedOrderBalances: React.FC<TabbedOrderBalancesProps> = ({
  orders,
  tradehistory,
  canceledorders,
  router,
  address,
  trades,
  tokenList,
  setTokenIn,
  setTokenOut,
  setSendTokenIn,
  setpopup,
  sortConfig,
  onSort,
  tokenBalances,
  orderCenterHeight,
  activeSection,
  setActiveSection,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  refetch,
}) => {
  return (
    <div className="portfolio-order-center-wrapper">
      <OrderCenter
        orders={orders}
        tradehistory={tradehistory}
        canceledorders={canceledorders}
        router={router}
        address={address}
        trades={trades}
        currentMarket={''}
        orderCenterHeight={orderCenterHeight}
        tokenList={tokenList}
        setTokenIn={setTokenIn}
        setTokenOut={setTokenOut}
        setSendTokenIn={setSendTokenIn}
        setpopup={setpopup}
        sortConfig={sortConfig}
        onSort={onSort}
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
      />
    </div>
  );
};

export default TabbedOrderBalances;
