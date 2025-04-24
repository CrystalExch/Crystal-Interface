import { useCallback, useRef, useState } from 'react';
import closebutton from '../../assets/close_button.png';
import { settings } from '../../settings.ts';
import './CustomLinkModal.css';

const CustomLinkModal = ({
  isOpen,
  onClose,
  refLinkString,
  setRefLinkString,
  onCreateRef,
  refLink,
  setpopup,
  setChain,
  error,
  setError,
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
  error: any;
  setError: any;
  account: any;
}) => {
  const [isSigning, setIsSigning] = useState(false);
  const [refLinkInput, setRefLinkInput] = useState(refLinkString);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      setRefLinkInput(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setRefLinkString(value);
        if (!isValidInput(value) && value.length > 0) {
          setError(t('invalid'));
        }
      }, 300);
    },
    [refLinkString],
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="ref-popup-title">
            {refLink ? t('customize') : t('create')}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" />
          </button>
        </div>
        {refLink ? (
          <div className="ref-popup-subtitle">{t('customizeWarning')}</div>
        ) : (
          <h3 className="ref-popup-subtitle">{t('createWarning')}</h3>
        )}

        <div className="input-wrapper">
          <input
            className={`modal-input ${error ? 'has-error' : ''}`}
            value={refLinkInput}
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
            https://app.crystal.exchange?ref={' '}
            <div className="ref-url">{refLinkInput}</div>
          </span>
        </div>

        <button
          className="customize-button"
          onClick={handleCreate}
          disabled={
            isSigning ||
            (account.connected && account.chainId == activechain && !!error) ||
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
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : (
            t('connectWallet')
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomLinkModal;
