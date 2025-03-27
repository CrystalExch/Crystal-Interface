import React, { useState } from 'react';
import './EnterACode.css';

interface EnterACodeProps {
  handleSetRef: any;
  usedRefLink: string;
  refLink: string;
}

const EnterACode: React.FC<EnterACodeProps> = ({
  handleSetRef,
  usedRefLink,
  refLink,
}) => {
  const [refCode, setRefCode] = useState<string>(usedRefLink);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>(refCode ? ` ${refCode}` : '');

  const handleSubmit = async (): Promise<void> => {
    if (!refCode) {
      setError(t('pleaseEnterCode'));
      return;
    }
    if (refCode === refLink) {
      setError(t('noSelfRefer'));
      return;
    }
    const succeed = await handleSetRef(refCode);
    if (succeed) {
      setSuccess(`${refCode}`);
    }
  };

  const handleClear = async (): Promise<void> => {
    const succeed = await handleSetRef('');
    if (succeed) {
      setRefCode('')
      setError('');
      setSuccess('');
    }
  };

  return (
    <div className="code-container">
      <div className="code-box">
        {error && <span className="error-message">{error}</span>}
        <div className="header-container">
          <h2 className="code-title">
            {usedRefLink ? t('usingCode') : t('enterReferralCode')}
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
                value={usedRefLink ? success : refCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!usedRefLink) {
                    setRefCode(e.target.value);
                    setError('');
                  }
                }}
                placeholder={t('enteracode')}
                className={usedRefLink ? 'code-input-success' : 'code-input'}
                readOnly={usedRefLink != ''}
              />
              {usedRefLink && (
                <button
                  onClick={handleClear}
                  className="clear-icon-button"
                  title="Clear code"
                >
                  {t('clear')}
                </button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={usedRefLink != ''}
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
