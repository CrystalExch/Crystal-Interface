import React from 'react';
import PortfolioHeader from './BalancesHeader/PortfolioHeader';
import PortfolioContent from './BalancesContent/BalancesContent';
import './PortfolioBalance.css';

interface SortConfig {
  column: string;
  direction: "desc" | "asc";
}

interface PortfolioBalanceProps {
  tokenList: any[];
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  tokenBalances: any;
  marketsData: any;
  isBlurred?: boolean;
}

const PortfolioBalance: React.FC<PortfolioBalanceProps> = ({
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sortConfig,
  onSort,
  tokenBalances,
  marketsData,
  isBlurred = false,
}) => {
  return (
    <div className="portfolio-balance-container">
      <div className="portfolio-balance-header-wrapper">
        <PortfolioHeader onSort={onSort} sortConfig={sortConfig} />
      </div>
      <div className="portfolio-balance-content-wrapper">
        <PortfolioContent
          tokenList={tokenList}
          onMarketSelect={onMarketSelect}
          setSendTokenIn={setSendTokenIn}
          setpopup={setpopup}
          sortConfig={sortConfig}
          tokenBalances={tokenBalances}
          isBlurred={isBlurred}
          marketsData={marketsData}
        />
      </div>
    </div>
  );
};

export default PortfolioBalance;