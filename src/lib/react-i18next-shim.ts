/**
 * React i18next Shim
 * Provides compatibility layer for components using react-i18next
 * Maps to our custom LanguageProvider implementation
 * 
 * ✅ CREATED 2026-01-16: Fix "NO_I18NEXT_INSTANCE" errors
 */

import { useTranslation as useCustomTranslation } from '../providers/LanguageProvider';

/**
 * Shim for react-i18next useTranslation hook
 * Returns our custom translation function in react-i18next format
 */
export function useTranslation() {
  const { t, language } = useCustomTranslation();
  
  return {
    t,
    i18n: {
      language,
      changeLanguage: () => {}, // Not used in our implementation
    },
  };
}

// Re-export for compatibility
export { useTranslation as default };
