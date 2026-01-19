/**
 * i18next Configuration
 * React-i18next setup with 6 language support
 * Migration from custom LanguageProvider - 2026-01-16
 * Enhanced with Phase 2 features - 2026-01-16
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { LanguageCode } from '../constants/languages';

// Import translation resources
import vi from './vi';
import en from './en';
import es from './es';
import ja from './ja';
import ko from './ko';
import zh from './zh';

// Define resources structure
const resources = {
  vi: { translation: vi },
  en: { translation: en },
  es: { translation: es },
  ja: { translation: ja },
  ko: { translation: ko },
  zh: { translation: zh },
} as const;

// i18next configuration
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    
    // Default language
    lng: 'vi',
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['vi', 'en', 'es', 'zh', 'ja', 'ko'],
    
    // Namespace
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Debug mode (disable in production)
    debug: false,
    
    // Interpolation config
    interpolation: {
      escapeValue: false, // React already escapes values
      // Support both {key} and {{key}} formats
      prefix: '{',
      suffix: '}',
    },
    
    // React-specific options
    react: {
      useSuspense: false, // ✅ Disable suspense for immediate availability
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span', 'b', 'em'],
    },
    
    // Language detector options
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language
      caches: ['localStorage'],
      
      // localStorage key
      lookupLocalStorage: 'vhv-language',
      
      // Cookie options
      cookieMinutes: 10080, // 7 days
    },
    
    // Load options
    load: 'languageOnly', // 'vi' instead of 'vi-VN'
    
    // Key separator
    keySeparator: '.', // Support nested keys like 'common.save'
    
    // Context separator
    contextSeparator: '_',
    
    // Plural separator
    pluralSeparator: '_',
    
    // Missing key handler
    saveMissing: false,
    missingKeyHandler: (lngs, ns, key) => {
      // Disable warning to prevent console loop
    },
  })
  .catch((error) => {
    console.error('❌ Failed to initialize i18next:', error);
  });

// Phase 2: Enable development tools
if (process.env.NODE_ENV === 'development') {
  // Import devtools dynamically
  import('../utils/i18n/devtools').then(devtools => {
    // Auto-watch for missing keys
    devtools.watchMissingKeys();
    
    // Log initial stats
    console.log('🌐 i18next initialized');
    console.log('💡 Tip: Use window.i18nDevTools.help() for debugging tools');
  });
}

// Export configured i18n instance
export default i18n;