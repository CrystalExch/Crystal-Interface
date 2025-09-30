import React, { useState } from 'react';
import closebutton from '../../../assets/close_button.png';
import './TradingPresetsPopup.css';

interface TradingPresetsPopupProps {
  onClose: () => void;
}   

const TradingPresetsPopup: React.FC<TradingPresetsPopupProps> = ({ onClose }) => {
  const [activePreset, setActivePreset] = useState(1);
  const [activeSettings, setActiveSettings] = useState<'buy' | 'sell'>('buy');
  const [slippage, setSlippage] = useState('20');
  const [priority, setPriority] = useState('0.001');
  const [bribe, setBribe] = useState('0.001');
  const [autoFee, setAutoFee] = useState(false);
  const [maxFee, setMaxFee] = useState('0.1');
  const [mevMode, setMevMode] = useState<'off' | 'reduced' | 'secure'>('off');
  const [rpc, setRpc] = useState('https://a...e.com');

  return (
    <div className="trading-presets-backdrop" onClick={onClose}>
      <div className="trading-presets-container" onClick={(e) => e.stopPropagation()}>
        <div className="trading-presets-header">
          <h3 className="trading-presets-title">Trading Settings</h3>
          <button className="trading-presets-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="trading-presets-content">
          <div className="trading-presets-tabs">
            {[1, 2, 3].map((preset) => (
              <button
                key={preset}
                className={`trading-preset-tab ${activePreset === preset ? 'active' : ''}`}
                onClick={() => setActivePreset(preset)}
              >
                PRESET {preset}
              </button>
            ))}
          </div>

          <div className="trading-settings-tabs">
            <button
              className={`trading-setting-tab ${activeSettings === 'buy' ? 'active' : ''}`}
              onClick={() => setActiveSettings('buy')}
            >
              Buy Settings
            </button>
            <button
              className={`trading-setting-tab ${activeSettings === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveSettings('sell')}
            >
              Sell Settings
            </button>
          </div>

          <div className="trading-presets-inputs">
            <div className="trading-preset-input-group">
              <input type="text" value={slippage} onChange={(e) => setSlippage(e.target.value)} className="trading-preset-input" />
              <div className="trading-preset-input-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                SLIPPAGE
              </div>
            </div>

            <div className="trading-preset-input-group">
              <input type="text" value={priority} onChange={(e) => setPriority(e.target.value)} className="trading-preset-input" />
              <div className="trading-preset-input-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="4"/>
                  <rect x="3" y="10" width="18" height="10"/>
                </svg>
                PRIORITY
              </div>
            </div>

            <div className="trading-preset-input-group">
              <input type="text" value={bribe} onChange={(e) => setBribe(e.target.value)} className="trading-preset-input" />
              <div className="trading-preset-input-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2" stroke="rgb(6,6,6)" strokeWidth="2"/>
                </svg>
                BRIBE
              </div>
            </div>
          </div>

          <div className="trading-presets-auto-fee">
            <label className="trading-auto-fee-checkbox">
              <input
                type="checkbox"
                checked={autoFee}
                onChange={(e) => setAutoFee(e.target.checked)}
              />
              <span className="trading-auto-fee-checkmark"></span>
              <span className="trading-auto-fee-label">Auto Fee</span>
            </label>
            <input
              type="text"
              value={`MAX FEE ${maxFee}`}
              className="trading-max-fee-input"
              disabled={!autoFee}
            />
          </div>

          <div className="trading-mev-section">
            <div className="trading-mev-label">
              <span>MEV Mode</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div className="trading-mev-options">
              <button
                className={`trading-mev-option ${mevMode === 'off' ? 'active' : ''}`}
                onClick={() => setMevMode('off')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                Off
              </button>
              <button
                className={`trading-mev-option ${mevMode === 'reduced' ? 'active' : ''}`}
                onClick={() => setMevMode('reduced')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Reduced
              </button>
              <button
                className={`trading-mev-option ${mevMode === 'secure' ? 'active' : ''}`}
                onClick={() => setMevMode('secure')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secure
              </button>
            </div>
          </div>

          <div className="trading-rpc-section">
            <div className="trading-rpc-label">RPC</div>
            <input
              type="text"
              value={rpc}
              onChange={(e) => setRpc(e.target.value)}
              className="trading-rpc-input"
            />
          </div>
        </div>

        <div className="trading-presets-footer">
          <button className="trading-presets-continue-button" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingPresetsPopup;