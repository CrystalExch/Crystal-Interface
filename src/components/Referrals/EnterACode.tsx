import React, { useState } from 'react';
import './EnterACode.css';

interface EnterACodeProps {
  setUsedRefLink: (refLink: string) => void;
  usedRefLink: string;
  refLink: string;
}

const EnterACode: React.FC<EnterACodeProps> = ({
  setUsedRefLink,
  usedRefLink,
  refLink,
}) => {
  const [refCode, setRefCode] = useState<string>(usedRefLink);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>(refCode ? ` ${refCode}` : '');
  const [isSet, setIsSet] = useState<boolean>(!!usedRefLink);

  const handleSubmit = async (): Promise<void> => {
    if (!refCode) {
      setError(t('pleaseEnterCode'));
      return;
    }
    if (refCode === refLink) {
      setError(t('noSelfRefer'));
      return;
    }

    setUsedRefLink(refCode);
    localStorage.setItem('ref', refCode);
    setSuccess(`${refCode}`);
    setIsSet(true);
  };

  const handleClear = (): void => {
    setRefCode('');
    setUsedRefLink('');
    localStorage.removeItem('ref');
    setError('');
    setSuccess('');
    setIsSet(false);
  };

  return (
    <div className="code-container">
      <div className="code-box">
        {error && <span className="error-message">{error}</span>}
        <div className="header-container">
          <h2 className="code-title">
            {isSet ? t('usingCode') : t('enterReferralCode')}
          </h2>
        </div>
        <p className="referral-subtitle">
          {t('referralSubtitle')}
          <a
            href="https://docs.crystal.exchange/community/referral-program"
            target="_blank"
            rel="noopener noreferrer"
            className="learn-more-link"
          >
            {' '}
            {t('learnMore')}
          </a>
        </p>

        <div className="input-container">
          <div className="input-row">
            <div className="input-with-clear">
              <input
                type="text"
                value={isSet ? success : refCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!isSet) {
                    setRefCode(e.target.value);
                    setError('');
                  }
                }}
                placeholder={t('enteracode')}
                className={isSet ? 'code-input-success' : 'code-input'}
                readOnly={isSet}
              />
              {isSet && (
                <button
                  onClick={handleClear}
                  className="clear-icon-button"
                >
                  {t('clear')}
                </button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSet}
              className="code-button"
            >
              {t('setRef')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterACode;