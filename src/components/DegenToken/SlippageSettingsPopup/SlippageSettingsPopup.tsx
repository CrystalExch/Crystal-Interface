import React, { useState } from 'react';
import './SlippageSettingsPopup.css';

export default function SlippageSettingsPopup({
  onClose,
  onApply,
  initial,
}: {
  onClose: () => void;
  onApply: (v: { slippage: string; fr: boolean; tip: string }) => void;
  initial: { slippage: string; fr: boolean; tip: string };
}) {
  const [slippage, setSlippage] = useState(initial.slippage);
  const [fr, setFr] = useState(initial.fr);
  const [tip, setTip] = useState(initial.tip);
  const reset = () => { setSlippage('2'); setFr(false); setTip('0.003'); };

  return (
    <div className="monitor-filters-backdrop" onClick={onClose}>
      <div className="monitor-filters-container" onClick={(e)=>e.stopPropagation()}>
        <div className="monitor-filters-header">
          <h3 className="monitor-filters-title">Trade Settings</h3>
          <button className="monitor-filters-close" onClick={onClose} aria-label="Close">
            <span className="monitor-close-x">×</span>
          </button>
        </div>

        <div className="monitor-filters-content">
          <div className="monitor-filter-group">
            <label className="monitor-filter-label">Max Slippage</label>
            <div className="monitor-filter-input-wrapper">
              <input
                className="monitor-filter-input"
                value={slippage}
                onChange={(e)=>setSlippage(e.target.value.replace(/[^\d.]/g,''))}
                placeholder="2"
                inputMode="decimal"
              />
              <span className="monitor-filter-input-suffix">%</span>
            </div>
          </div>

          <div className="monitor-filter-group">
            <label className="monitor-filter-label">Front-running Protection</label>
            <div className="settings-chips">
            <button
                className={`settings-chip ${fr ? 'active' : ''}`}
                data-state={fr ? 'on' : 'off'}
                aria-pressed={fr}
                onClick={() => setFr(true)}
            >
                On
            </button>
            <button
                className={`settings-chip ${!fr ? 'active' : ''}`}
                data-state={!fr ? 'on' : 'off'}
                aria-pressed={!fr}
                onClick={() => setFr(false)}
            >
                Off
            </button>
            </div>

          </div>

          <div className="monitor-filter-group">
            <label className="monitor-filter-label">Tip Amount</label>
            <div className="monitor-filter-input-wrapper">
              <input
                className="monitor-filter-input"
                value={tip}
                onChange={(e)=>setTip(e.target.value.replace(/[^\d.]/g,''))}
                placeholder="0.003"
                inputMode="decimal"
              />
              <span className="monitor-filter-input-suffix">MON</span>
            </div>
          </div>
        </div>

        <div className="monitor-filters-footer">
          <button className="monitor-filters-reset-button" onClick={reset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
            </svg>
          </button>
          <button className="monitor-filters-apply-button" onClick={()=>onApply({ slippage, fr, tip })}>Apply</button>
        </div>
      </div>
    </div>
  );
}
