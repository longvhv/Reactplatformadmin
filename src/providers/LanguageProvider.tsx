'use client';

/**
 * Language Provider - Compatibility Wrapper
 * Forwards to I18nextProvider with same API
 * Migration Phase 1 - 2026-01-16
 * 
 * This is now a thin wrapper around react-i18next.
 * All components importing from './providers/LanguageProvider'
 * will automatically use react-i18next without changes.
 * 
 * ✅ FIX 2026-01-16: Export useTranslation as useLanguage for backward compatibility
 */

export {
  I18nextProvider as LanguageProvider,
  useTranslation,
  useChangeLanguage,
} from './I18nextProvider';

// ✅ FIX: Export useTranslation as useLanguage (components expect object, not string)
import { useTranslation as useI18nextTranslation } from './I18nextProvider';

export function useLanguage() {
  return useI18nextTranslation();
}

export function useLanguageContext() {
  return useI18nextTranslation();
}