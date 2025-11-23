import React, { useState, useEffect } from 'react';
import './EnterACode.css';

interface EnterACodeProps {
  usedRefLink?: string;
  setUsedRefLink: any;
  refLink: string;
  inputValue: string;
  setInputValue: (val: string) => void;
}

const EnterACode: React.FC<EnterACodeProps> = ({
  usedRefLink = '',
  setUsedRefLink,
  refLink,
  inputValue,
  setInputValue,
}) => {
  const [error, setError] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false); 
  
  const normalizedUsed = usedRefLink.trim();
  const hasCode = normalizedUsed !== '';
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000); 
      
      return () => clearTimeout(timer);
    }
  }, [error]); 

  const handleSubmit = async (): Promise<void> => {
    if (!inputValue.trim()) {
      setError(t('pleaseEnterCode'));
      return;
    }
    if (inputValue.trim() === refLink.trim()) {
      setError(t('noSelfRefer'));
      return;
    }
    
    setError('');
    setIsSigning(true);
    
    try {
      const ok = await setUsedRefLink(inputValue.trim());
      if (!ok) {
        setError(t('setRefFailed'));
      }
    } finally {
      setIsSigning(false); 
    }
  };
  
  const handleClear = async (): Promise<void> => {
    if (!hasCode || isClearing) return;
    setError('');
    setIsClearing(true);
    
    await setUsedRefLink('');
    setInputValue(''); 
    
    setIsClearing(false);
  };
  
  return (
    <div className="code-container">
      <div className="code-box">
        {error && <span className="error-message">{error}</span>}
        <div className="header-container">
          <h2 className="code-title">
            {!hasCode ? t('usingCode') : t('enterReferralCode')}
          </h2>
        </div>
        <p className="referral-subtitle">
          {t('referralSubtitle')}{' '}
          <a
            href="https://docs.crystal.exchange/community/referral-campaign"
            target="_blank"
            rel="noopener noreferrer"
            className="learn-more-link"
          >
            {t('learnMore')}
          </a>
        </p>
        <div className="input-container">
          <div className="input-row">
            <div className="input-with-clear">
              <input
                type="text"
                placeholder={t('enteracode')}
                className={hasCode ? 'code-input-success' : 'code-input'}
                readOnly={hasCode}
                value={hasCode ? normalizedUsed : inputValue}
                onChange={(e) => {
                  if (!hasCode) {
                    setInputValue(e.target.value);
                    setError('');
                  }
                }}
              />
              {hasCode && (
                <button
                  onClick={handleClear}
                  disabled={isClearing}
                  className="clear-icon-button"
                >
                  {isClearing ? (
                    <span className="loader-spinner-white"></span>
                  ) : (
                    t('clear')
                  )}
                </button>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={hasCode || isSigning}
              className="code-button"
            >
              {isSigning ? (
                <span className="loader-spinner-black"></span>
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