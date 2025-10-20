import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import LP from '../LP/LP';
import LPVaults from '../LPVaults/LPVaults';

import './Earn.css';

interface EarnProps {
  setpopup: (value: number) => void;
  onSelectToken: (token: { symbol: string; icon: string }) => void;
  setOnSelectTokenCallback?: (callback: ((token: { symbol: string; icon: string }) => void) | null) => void;
  selectedToken?: any;
  tokenBalances: Record<string, any>;
  tokendict: { [address: string]: any };
  address: string;
  connected: boolean;
  refetch?: () => void;
  tradesByMarket: Record<string, any[]>;
  markets: Record<string, any>;
  usdc: any;
  wethticker: any;
  ethticker: any;
  account: any;
  sendUserOperationAsync: any;
  activechain: number;
  setChain: () => void;
  selectedVault: any;
  setselectedVault: any;
  isVaultDepositSigning: boolean;
  setIsVaultDepositSigning: (signing: boolean) => void;
  isVaultWithdrawSigning: boolean;
  setIsVaultWithdrawSigning: (signing: boolean) => void;
  crystalVaultsAddress: any;
  router: string;
  formatUSDDisplay: any;
  calculateUSDValue: any;
  getMarket: any;
  vaultList: any;
  isLoading: any;
  depositors: any;
  depositHistory: any;
  withdrawHistory: any;
  openOrders: any;
  allOrders: any;
  selectedVaultStrategy: any;
  setSelectedVaultStrategy: any;
}

const Earn: React.FC<EarnProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'liquidity' | 'vaults'>('liquidity');

  useEffect(() => {
    if (location.pathname.includes('/earn/liquidity')) {
      setActiveTab('liquidity');
    } else if (location.pathname.includes('/earn/vaults')) {
      setActiveTab('vaults');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'liquidity' | 'vaults') => {
    setActiveTab(tab);
    if (tab === 'liquidity') {
      navigate('/earn/liquidity');
    } else {
      navigate('/earn/vaults');
    }
  };

  const handleRouteChange = (route: string) => {
    navigate(route);
  };

  return (
    <div className="earn-page-container">
      <div className="earn-page-header">
        <div className="earn-title-section">
          <h1 className="earn-main-title">Earn</h1>
          <p className="earn-subtitle">Earn rewards by providing liquidity to both passive and automated strategies</p>
        </div>
        <div className="earn-toggle-container">
          <div className="earn-toggle" data-active={activeTab}>
            <button
              className={`earn-toggle-tab ${activeTab === 'liquidity' ? 'active' : ''}`}
              onClick={() => handleTabChange('liquidity')}
            >
              Liquidity Pools
            </button>
            <button
              className={`earn-toggle-tab ${activeTab === 'vaults' ? 'active' : ''}`}
              onClick={() => handleTabChange('vaults')}
            >
              Vaults
            </button>
          </div>
        </div>
      </div>

      <div className="earn-content">
        {activeTab === 'liquidity' ? (
          <LP
            setpopup={props.setpopup}
            onSelectToken={props.onSelectToken}
            setOnSelectTokenCallback={props.setOnSelectTokenCallback}
            tokendict={props.tokendict}
            tradesByMarket={props.tradesByMarket}
            markets={props.markets}
            tokenBalances={props.tokenBalances}
            connected={props.connected}
            account={props.account}
            sendUserOperationAsync={props.sendUserOperationAsync}
            setChain={props.setChain}
            address={props.address}
            refetch={props.refetch}
          />
        ) : (
          <LPVaults
            setpopup={props.setpopup}
            onSelectToken={props.onSelectToken}
            setOnSelectTokenCallback={props.setOnSelectTokenCallback}
            tokendict={props.tokendict}
            currentRoute={location.pathname}
            onRouteChange={handleRouteChange}
            connected={props.connected}
            account={props.account}
            selectedVault={props.selectedVault}
            setselectedVault={props.setselectedVault}
            isVaultWithdrawSigning={props.isVaultWithdrawSigning}
            setIsVaultWithdrawSigning={props.setIsVaultWithdrawSigning}
            sendUserOperationAsync={props.sendUserOperationAsync}
            setChain={props.setChain}
            address={props.address}
            activechain={props.activechain}
            crystalVaultsAddress={props.crystalVaultsAddress}
            formatUSDDisplay={props.formatUSDDisplay}
            calculateUSDValue={props.calculateUSDValue}
            tradesByMarket={props.tradesByMarket}
            getMarket={props.getMarket}
            vaultList={props.vaultList}
            isLoading={props.isLoading}
            depositors={props.depositors}
            depositHistory={props.depositHistory}
            withdrawHistory={props.withdrawHistory}
            openOrders={props.openOrders}
            allOrders={props.allOrders}
            selectedVaultStrategy={props.selectedVaultStrategy}
            setSelectedVaultStrategy={props.setSelectedVaultStrategy}
          />
        )}
      </div>
    </div>
  );
};

export default Earn;