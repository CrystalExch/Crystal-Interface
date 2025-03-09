import { switchChain } from '@wagmi/core';
import React, { useRef } from 'react';
import { config } from '../../../wagmi';

import { useClickOutside } from '../utils';

import { useSharedContext } from '../../../contexts/SharedContext';

import { settings } from '../../../config';

import './NetworkSelector.css';

interface NetworkSelectorProps {
  isNetworkSelectorOpen: boolean;
  setNetworkSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setTokenIn: any;
  setTokenOut: any;
  setorders: any;
  settradehistory: any;
  settradesByMarket: any;
  setcanceledorders: any;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  isNetworkSelectorOpen,
  setNetworkSelectorOpen,
  setTokenIn,
  setTokenOut,
  setorders,
  settradehistory,
  settradesByMarket,
  setcanceledorders,
}) => {
  const networkSelectorRef = useRef<HTMLDivElement>(null);
  const { activechain, setactivechain } = useSharedContext();

  useClickOutside(networkSelectorRef, () => setNetworkSelectorOpen(false));

  return (
    <div className="network-selector" ref={networkSelectorRef}>
      <button
        onClick={() => setNetworkSelectorOpen(!isNetworkSelectorOpen)}
        className="network-selector-button"
      >
        <img
          src={settings.chainConfig[activechain].image}
          className="network-active-logo"
        />
      </button>
      {isNetworkSelectorOpen && (
        <div className="network-dropdown">
          <span className="network-label">{t('networks')}</span>
          {Object.keys(settings.chainConfig).map((chainId) => (
            <div
              key={chainId}
              className={`network-option ${activechain == Number(chainId) ? 'selected' : ''}`}
              onClick={() => {
                setNetworkSelectorOpen(!isNetworkSelectorOpen);
                if (activechain != Number(chainId)) {
                  switchChain(config, { chainId: Number(chainId) });
                  setactivechain(Number(chainId));
                  setTokenIn(settings.chainConfig[Number(chainId)].usdc);
                  setTokenOut(settings.chainConfig[Number(chainId)].eth);
                  setorders([]);
                  settradehistory([]);
                  settradesByMarket({});
                  setcanceledorders([]);
                }
              }}
            >
              <img
                src={settings.chainConfig[Number(chainId)].image}
                className="network-option-logo"
              />
              {settings.chainConfig[Number(chainId)].name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;
