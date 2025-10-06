import React, { useState } from 'react';
import closebutton from '../../../assets/close_button.png';
import './ LiveTradesSettingsPopup.css';

interface LiveTradesSettingsPopupProps {
  onClose: () => void;
}

const LiveTradesSettingsPopup: React.FC<LiveTradesSettingsPopupProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'toasts'>('general');
  const [openToastInNewTab, setOpenToastInNewTab] = useState(false);
  const [pauseFeedOnHover, setPauseFeedOnHover] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [volume, setVolume] = useState(50);

  return (
    <div className="live-trades-settings-backdrop" onClick={onClose}>
      <div className="live-trades-settings-container" onClick={(e) => e.stopPropagation()}>
        <div className="live-trades-settings-header">
          <h3 className="live-trades-settings-title">Live Trades Settings</h3>
          <button className="live-trades-settings-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="live-trades-settings-content">
            <div className="live-trades-settings-section">
              <div className="live-trades-settings-row">
                <span className="live-trades-settings-label">Open toast alerts in new tab</span>
                <label className="live-trades-settings-toggle">
                  <input
                    type="checkbox"
                    checked={openToastInNewTab}
                    onChange={(e) => setOpenToastInNewTab(e.target.checked)}
                  />
                  <span className="live-trades-settings-toggle-slider"></span>
                </label>
              </div>

              <div className="live-trades-settings-row">
                <span className="live-trades-settings-label">Pause live feed on hover</span>
                <label className="live-trades-settings-toggle">
                  <input
                    type="checkbox"
                    checked={pauseFeedOnHover}
                    onChange={(e) => setPauseFeedOnHover(e.target.checked)}
                  />
                  <span className="live-trades-settings-toggle-slider"></span>
                </label>
              </div>

              <div className="live-trades-settings-divider"></div>

              <div className="live-trades-settings-row">
                <div>
                  <div className="live-trades-settings-label">Sound alerts</div>
                  <div className="live-trades-settings-sublabel">Play sound alerts for alerted wallets</div>
                </div>
                <label className="live-trades-settings-toggle">
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                  />
                  <span className="live-trades-settings-toggle-slider"></span>
                </label>
              </div>

              <div className="live-trades-settings-volume">
                <div className="live-trades-settings-volume-header">
                  <span className="live-trades-settings-label">Volume</span>
                  <span className="live-trades-settings-volume-value">{volume} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="live-trades-settings-slider"
                  style={{ '--slider-percent': `${volume}%` } as React.CSSProperties}
                />
                <div className="live-trades-settings-slider-labels">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
        </div>

        <div className="live-trades-settings-footer">
          <button className="live-trades-settings-done-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveTradesSettingsPopup;