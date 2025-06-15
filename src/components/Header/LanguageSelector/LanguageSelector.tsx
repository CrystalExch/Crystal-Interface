import React, { useEffect, useRef } from 'react';
import languagearrow from '../../../assets/chevron_arrow.png';
import { useLanguage } from '../../../contexts/LanguageContext';
import './LanguageSelector.css';

interface Language {
  code: string;
  name: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  isLanguageDropdownOpen: boolean;
  setIsLanguageDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHeader?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  isLanguageDropdownOpen,
  setIsLanguageDropdownOpen,
  isHeader = false,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const languageSelectorRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    const isClickOutsideLanguageSelector =
      languageSelectorRef.current &&
      !languageSelectorRef.current.contains(event.target as Node);

    const isClickOnHeader =
      isHeader && (event.target as HTMLElement).closest('.app-settings-button');
    const isClickOnSettingsPopup = (event.target as HTMLElement).closest(
      '.layout-settings-content',
    );

    if (
      isClickOutsideLanguageSelector &&
      !isClickOnHeader &&
      !isClickOnSettingsPopup
    ) {
      setIsLanguageDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const selectLanguageOption = (langCode: string) => {
    setLanguage(langCode);
    setIsLanguageDropdownOpen(false);
    localStorage.setItem('crystal_language', langCode);
  };

  if (isHeader) {
    return (
      <div
        className="language-dropdown header-dropdown"
        style={{ maxHeight: '216.2px' }}
        ref={languageSelectorRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="language-options">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`language-option ${language === lang.code ? 'selected' : ''}`}
              onClick={() => selectLanguageOption(lang.code)}
            >
              {lang.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="language-selector" ref={languageSelectorRef}>
      <button
        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
        className="language-selector-button"
      >
        <span className="current-language">{language.toUpperCase()}</span>
        <img src={languagearrow} className="language-arrow" />
      </button>

      {isLanguageDropdownOpen && (
        <div
        className="language-dropdown header-dropdown"
        style={{ maxHeight: '216.2px' }}
        ref={languageSelectorRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="language-options">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`language-option ${language === lang.code ? 'selected' : ''}`}
              onClick={() => selectLanguageOption(lang.code)}
            >
              {lang.name}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default LanguageSelector;
