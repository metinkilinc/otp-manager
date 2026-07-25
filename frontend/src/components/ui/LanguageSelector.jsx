import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/80 hover:bg-white text-gray-700 hover:text-blue-600 border border-gray-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
        title={currentLang === 'tr' ? 'Switch to English' : 'Switch to Turkish'}
      >
        <Globe size={14} className="text-blue-500" />
        <span>{currentLang === 'tr' ? 'TR 🇹🇷' : 'EN 🇬🇧'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200" style={{ display: 'inline-flex', padding: '2px', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
      <button
        type="button"
        onClick={() => {
          i18n.changeLanguage('tr');
          localStorage.setItem('lang', 'tr');
        }}
        style={{
          padding: '3px 8px',
          fontSize: '0.75rem',
          fontWeight: 800,
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: currentLang === 'tr' ? '#3182CE' : 'transparent',
          color: currentLang === 'tr' ? 'white' : '#64748B',
          boxShadow: currentLang === 'tr' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        🇹🇷 TR
      </button>
      <button
        type="button"
        onClick={() => {
          i18n.changeLanguage('en');
          localStorage.setItem('lang', 'en');
        }}
        style={{
          padding: '3px 8px',
          fontSize: '0.75rem',
          fontWeight: 800,
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: currentLang === 'en' ? '#3182CE' : 'transparent',
          color: currentLang === 'en' ? 'white' : '#64748B',
          boxShadow: currentLang === 'en' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageSelector;
