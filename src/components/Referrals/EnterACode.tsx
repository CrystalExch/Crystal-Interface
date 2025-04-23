import React, { useState, useEffect } from 'react';

import './EnterACode.css';

interface EnterACodeProps {
  setUsedRefLink: (refLink: string) => Promise<boolean>;
  usedRefLink: string;
  refLink: string;
}

const EnterACode: React.FC<EnterACodeProps> = ({
  setUsedRefLink,
  usedRefLink,
  refLink,
}) => {
  const [refCode, setRefCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSet, setIsSet] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    if (usedRefLink) {
      setRefCode(usedRefLink);
      setSuccess(usedRefLink);
      setIsSet(true);
    }
  }, [usedRefLink]);

  const handleSubmit = async (): Promise<void> => {
    if (!refCode) {
      setError(t('pleaseEnterCode'));
      return;
    }
    
    if (refCode === refLink) {
      setError(t('noSelfRefer'));
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await setUsedRefLink(refCode);
      
      if (success) {
        setSuccess(refCode);
        setIsSet(true);
        setError('');
      } else {
        setError(t('failedToSetRefCode'));
      }
    } catch (err) {
      setError(t('errorSettingRefCode'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      const success = await setUsedRefLink('');
      
      if (success) {
        setUsedRefLink('');
        setSuccess('');
        setIsSet(false);
        setError('');
      }
    } catch (err) {
      setError(t('errorClearingRefCode'));
    } finally {
      setIsSubmitting(false);
    }
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
                value={refCode}
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
                  disabled={isSubmitting}
                >
                  {t('clear')}
                </button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSet || isSubmitting}
              className="code-button"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner-small"></div>
                  {t('setting')}
                </>
              ) : (
                t('setRef')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterACode;