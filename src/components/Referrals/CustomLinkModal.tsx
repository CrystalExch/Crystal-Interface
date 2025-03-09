import { useState } from 'react';
import { useAccount } from 'wagmi';
import closebutton from '../../assets/close_button.png';
import { settings } from '../../config';
import { config } from '../../wagmi';
import './CustomLinkModal.css';

const CustomLinkModal = ({
  isOpen,
  onClose,
  refLinkString,
  setRefLinkString,
  onCreateRef,
  refLink,
  setpopup,
  switchChain,
  error,
  setError,
}: {
  isOpen: boolean;
  onClose: () => void;
  refLinkString: string;
  setRefLinkString: (value: string) => void;
  onCreateRef: () => Promise<boolean>;
  refLink: any;
  setpopup: any;
  switchChain: any;
  error: any;
  setError: any;
}) => {
  const [isSigning, setIsSigning] = useState(false);

  const account = useAccount();

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (account.status === 'connected' && account.chainId === activechain) {
      if (!isValidInput(refLinkString)) return;
      setIsSigning(true);
      const isSuccess = await onCreateRef();
      setIsSigning(false);
      if (isSuccess) {
        onClose();
      }
    } else {
      account.status != 'connected'
        ? setpopup(4)
        : switchChain(config, { chainId: activechain as any });
    }
  };

  const isValidInput = (value: string) => {
    const regex = /^[a-zA-Z0-9-]{0,20}$/;
    return regex.test(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRefLinkString(value);

    if (!isValidInput(value) && value.length > 0) {
      setError(t('invalid'));
    } else {
      setError('');
    }
  };

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
            https://app.crystal.exchange?ref={' '}
            <div className="ref-url">{refLinkString}</div>
          </span>
        </div>

        <button
          className="customize-button"
          onClick={handleCreate}
          disabled={
            isSigning ||
            (account.status === 'connected' &&
              account.chainId == activechain &&
              !!error) ||
            (account.status === 'connected' &&
              account.chainId !== activechain) ||
            !refLinkString
          }
        >
          {isSigning ? (
            <>
              <div className="loading-spinner"></div>
              {t('signTxn')}
            </>
          ) : account.status === 'connected' &&
            account.chainId === activechain ? (
            <>{refLink ? t('customize') : t('create')}</>
          ) : account.status === 'connected' ? (
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
