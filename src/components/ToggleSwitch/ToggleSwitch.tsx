import React from 'react';
import './ToggleSwitch.css';
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: any;
  disabled?: any;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled,
}) => {
  return (
    <div className="market-toggle-switch-container">
      <label className="market-toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => {e.stopPropagation(); onChange()}} />
        <div className={`market-toggle-switch-background ${disabled && 'disabled'}`}>
          <div className="market-toggle-switch-handle"></div>
        </div>
      </label>
      {label && <span className="only-current-market-label">{label}</span>}
    </div>
  );
};

export default ToggleSwitch;
