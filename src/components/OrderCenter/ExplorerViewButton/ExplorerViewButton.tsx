import React from 'react';

import './ExplorerViewButton.css';

interface ViewButtonProps {
  txHash: string;
  explorer: string;
}

const ViewButton: React.FC<ViewButtonProps> = ({ txHash, explorer }) => (
  <a
    className="oc-view-button"
    href={`${explorer}/tx/${txHash}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span>{t('view')}</span>
  </a>
);

export default ViewButton;
