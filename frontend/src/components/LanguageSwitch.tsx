import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const LanguageSwitch: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const languages = [
    { code: 'fr', name: 'language.fr', flag: '🇫🇷' },
    { code: 'en', name: 'language.en', flag: '🇬🇧' },
    { code: 'es', name: 'language.es', flag: '🇪🇸' },
    { code: 'nl', name: 'language.nl', flag: '🇳🇱' },
    { code: 'de', name: 'language.de', flag: '🇩🇪' },
    { code: 'it', name: 'language.it', flag: '🇮🇹' },
    { code: 'pt', name: 'language.pt', flag: '🇵🇹' },
    { code: 'zh', name: 'language.zh', flag: '🇨🇳' },
    { code: 'ar', name: 'language.ar', flag: '🇸🇦' },
    { code: 'ru', name: 'language.ru', flag: '🇷🇺' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Calculate dropdown position
      if (spaceBelow < 400 && spaceAbove > spaceBelow) {
        setDropdownStyle({
          position: 'fixed',
          top: buttonRect.top - 400 > 0 ? buttonRect.top - 400 : 10,
          right: window.innerWidth - buttonRect.right,
          width: '12rem'
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: buttonRect.bottom + 8,
          right: window.innerWidth - buttonRect.right,
          width: '12rem'
        });
      }
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/90 transition-all duration-200 shadow-sm"
        aria-label={t('language.switch')}
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {currentLanguage ? t(currentLanguage.name) : 'FR'}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            style={dropdownStyle}
            className="bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden max-h-[60vh] sm:max-h-[70vh] overflow-y-auto custom-scrollbar"
          >
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors duration-150 ${
                  i18n.language === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{t(language.name)}</span>
                {i18n.language === language.code && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default LanguageSwitch;