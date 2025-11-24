import { useCallback, useState } from 'react';
import closebutton from '../../assets/close_button.png';
import { settings } from '../../settings.ts';
import './CustomLinkModal.css';

// Temporary translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    'create': 'Create Referral Code',
    'customize': 'Customize Referral Code',
    'createWarning': 'Choose a unique code for your referral link. This cannot be changed later.',
    'customizeWarning': 'Update your referral code. Note: This will replace your existing code.',
    'enteracode': 'Enter a code',
    'createCode': 'Enter your referral code',
    'yourLink': 'Your referral link:',
    'signTxn': 'Signing...',
    'switchto': 'Switch to',
    'connectWallet': 'Connect Wallet',
  };
  return translations[key] || key;
};

const CustomLinkModal = ({
  isOpen,
  onClose,
  refLinkString,
  setRefLinkString,
  onCreateRef,
  refLink,
  setpopup,
  setChain,
  setError,
  error,
  account,
}: {
  isOpen: boolean;
  onClose: () => void;
  refLinkString: string;
  setRefLinkString: (value: string) => void;
  onCreateRef: () => Promise<boolean>;
  refLink: any;
  setpopup: any;
  setChain: any;
  setError: any;
  error: any;
  account: any;
}) => {
  const [isSigning, setIsSigning] = useState(false);

  const handleCreate = async () => {
    if (account.connected && account.chainId === activechain) {
      if (!isValidInput(refLinkString)) return;
      setIsSigning(true);
      const isSuccess = await onCreateRef();
      setIsSigning(false);
      if (isSuccess) {
        onClose();
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
    }
  };

  const isValidInput = (value: string) => {
    const regex = /^[a-zA-Z0-9-]{0,20}$/;
    return regex.test(value);
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (isValidInput(value) || value === "") {
        setRefLinkString(value);
        setError('')
      }
    },
    [refLinkString],
  );

  if (!isOpen) return null;

  return (
    <div className="ref-modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="ref-popup-title">
            {refLink ? t('customize') : t('create')}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" />
          </button>
        </div>

        <div className="input-wrapper">
          <input
            className={`modal-input ${error ? 'has-error' : ''}`}
            value={refLinkString}
            onChange={handleInputChange}
            placeholder={refLink ? t('enteracode') : t('createCode')}
            maxLength={20}
            autoFocus
          />
        </div>
        {error && <div className="input-error">{error}</div>}
        <div className="referral-preview">
          {t('yourLink')}
          <br />
          <span className="ref-link-structure">
            https://app.crystal.exchange?ref=<span className="ref-url">{refLinkString}</span>
          </span>
        </div>

        <button
          className="customize-button"
          onClick={handleCreate}
          disabled={
            isSigning ||
            !refLinkString
          }
        >
          {isSigning ? (
            <>
              <div className="loading-spinner"></div>
              {t('signTxn')}
            </>
          ) : account.connected && account.chainId === activechain ? (
            <>{refLink ? t('customize') : t('create')}</>
          ) : account.connected ? (
            `${t('switchto')} ${settings.chainConfig[activechain]?.name || 'correct network'}`
          ) : (
            t('connectWallet')
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomLinkModal;