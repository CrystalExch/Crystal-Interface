import React from 'react';
import './LayoutToggle.css';

interface LayoutToggleProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const LayoutToggle: React.FC<LayoutToggleProps> = ({
  simpleView,
  setSimpleView,
}) => {
  const handleLayoutChange = (layout: 'lite' | 'pro') => {
    const isSimpleView = layout === 'lite';
    setSimpleView(isSimpleView);
    window.dispatchEvent(new Event('resize'));
  };

  return (
    <div className="layout-toggle-container">
      <button
        onClick={() => handleLayoutChange('lite')}
        className={`layout-toggle-button ${simpleView ? 'active' : ''}`}
      >
        {t('basic')}
      </button>
      <button
        onClick={() => handleLayoutChange('pro')}
        className={`layout-toggle-button ${!simpleView ? 'active' : ''}`}
      >
        {t('pro')}
      </button>
    </div>
  );
};

export default LayoutToggle;
