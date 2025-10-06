import React, { useState } from 'react';
import closebutton from '../../assets/close_button.png';

interface ImportWalletsPopupProps {
  onClose: () => void;
  onImport: (walletsText: string, addToSingleGroup: boolean) => void;
}

const ImportWalletsPopup: React.FC<ImportWalletsPopupProps> = ({ onClose, onImport }) => {
  const [importText, setImportText] = useState('');
  const [addToSingleGroup, setAddToSingleGroup] = useState(false);

  const handleImport = () => {
    if (importText.trim()) {
      onImport(importText, addToSingleGroup);
      onClose();
    }
  };

  return (
    <div className="import-wallets-backdrop" onClick={onClose}>
      <div className="import-wallets-container" onClick={(e) => e.stopPropagation()}>
        <div className="import-wallets-header">
          <h3 className="import-wallets-title">Import Wallets</h3>
          <button className="import-wallets-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="import-wallets-content">
          <textarea
            className="import-wallets-textarea"
            placeholder="Paste your exported wallets here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="import-wallets-button-container">
            <button
                className="import-wallets-button"
                onClick={handleImport}
                disabled={!importText.trim()}
            >
                Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWalletsPopup;