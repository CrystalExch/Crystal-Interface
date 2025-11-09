import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import closebutton from '../../assets/close_button.png';
import './AddWalletModal.css';

export interface TrackedWallet {
  id: string;
  address: string;
  name: string;
  emoji: string;
  balance: number;
  lastActiveAt: number | null;
  createdAt: string;
}

interface AddWalletModalProps {
  onClose: () => void;
  onAdd: (wallet: TrackedWallet) => void;
  existingWallets: TrackedWallet[];
}

const isValidAddress = (addr: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

const AddWalletModal: React.FC<AddWalletModalProps> = ({
  onClose,
  onAdd,
  existingWallets,
}) => {
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletEmoji, setNewWalletEmoji] = useState('😀');
  const [addWalletError, setAddWalletError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleAddWallet = () => {
    setAddWalletError('');

    if (!newWalletAddress.trim()) {
      setAddWalletError('Please enter a wallet address');
      return;
    }

    if (!isValidAddress(newWalletAddress.trim())) {
      setAddWalletError('Invalid wallet address');
      return;
    }

    if (
      existingWallets.some(
        (w) => w.address.toLowerCase() === newWalletAddress.trim().toLowerCase()
      )
    ) {
      setAddWalletError('This wallet is already being tracked');
      return;
    }

    const name = (
      newWalletName.trim() ||
      `${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`
    ).slice(0, 20);

    const newWallet: TrackedWallet = {
      id: Date.now().toString(),
      address: newWalletAddress.trim(),
      name,
      emoji: newWalletEmoji,
      balance: 0,
      lastActiveAt: null,
      createdAt: new Date().toISOString(),
    };

    onAdd(newWallet);
  };

  return (
    <>
      <div className="add-wallet-modal-backdrop" onClick={onClose}>
        <div
          className="add-wallet-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="add-wallet-modal-header">
            <h3 className="add-wallet-modal-title">Add Wallet</h3>
            <button className="add-wallet-modal-close" onClick={onClose}>
              <img src={closebutton} className="add-wallet-close-button-icon" alt="Close" />
            </button>
          </div>
          <div className="add-wallet-modal-content">
            <div className="add-wallet-input-section">
              <input
                type="text"
                className="add-wallet-input"
                value={newWalletAddress}
                onChange={(e) => {
                  setNewWalletAddress(e.target.value);
                  setAddWalletError('');
                }}
                placeholder="Wallet Address"
              />
            </div>

            <div className="add-wallet-input-section">
              <div className="add-wallet-input-with-emoji">
                <button
                  className="add-wallet-emoji-picker-trigger"
                  onClick={(e) => {
                    if (!showEmojiPicker) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setEmojiPickerPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX + rect.width / 2,
                      });
                    }
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  type="button"
                >
                  {newWalletEmoji}
                </button>
                <input
                  type="text"
                  className="add-wallet-input add-wallet-input-with-emoji-field"
                  value={newWalletName}
                  onChange={(e) => {
                    setNewWalletName(e.target.value);
                    setAddWalletError('');
                  }}
                  placeholder="Wallet Name"
                  maxLength={20}
                />
              </div>
            </div>

            {addWalletError && (
              <div className="add-wallet-error-message">{addWalletError}</div>
            )}

            <div className="add-wallet-modal-actions">
              <button
                className="add-wallet-confirm-button"
                onClick={handleAddWallet}
                disabled={!newWalletAddress.trim()}
              >
                Add Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEmojiPicker && emojiPickerPosition && (
        <div
          className="add-wallet-emoji-picker-backdrop"
          onClick={() => {
            setShowEmojiPicker(false);
            setEmojiPickerPosition(null);
          }}
        >
          <div
            className="add-wallet-emoji-picker-positioned"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${emojiPickerPosition.top}px`,
              left: `${emojiPickerPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setNewWalletEmoji(emojiData.emoji);
                setShowEmojiPicker(false);
                setEmojiPickerPosition(null);
              }}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{
                showPreview: false,
              }}
              style={{
                backgroundColor: '#000000',
                border: '1px solid rgba(179, 184, 249, 0.2)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AddWalletModal;
