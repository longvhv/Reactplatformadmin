'use client';

/**
 * I18next Provider with Compatibility Layer
 * Drop-in replacement for LanguageProvider with same API
 * Migration Phase 1 - 2026-01-16
 */

import React, { ReactNode, useEffect } from 'react';
import { I18nextProvider as ReactI18nextProvider, useTranslation as useI18nextTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import type { LanguageCode } from '../constants/languages';

interface I18nextProviderProps {
  children: ReactNode;
}

/**
 * Main Provider Component
 * Wraps app with I18nextProvider
 */
export function I18nextProvider({ children }: I18nextProviderProps) {
  return (
    <ReactI18nextProvider i18n={i18n}>
      {children}
    </ReactI18nextProvider>
  );
}

/**
 * Custom hook with backward compatibility
 * Provides same API as old LanguageProvider
 * ✅ FIX: Handle case when i18n is not ready
 */
export function useTranslation() {
  // ✅ CRITICAL FIX: Call hook unconditionally (Rules of Hooks)
  // But safely handle undefined returns
  const translationHook = useI18nextTranslation();
  
  // Safely extract values with fallbacks
  const i18nT = translationHook?.t;
  const i18nInstance = translationHook?.i18n || {
    language: 'vi',
    changeLanguage: async () => {},
    isInitialized: false,
    on: () => {},
    off: () => {},
  };
  
  // Sync language changes to localStorage and document
  useEffect(() => {
    if (!i18nInstance) return;
    
    const handleLanguageChange = (lng: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vhv-language', lng);
        document.documentElement.lang = lng;
      }
    };
    
    // Initial sync
    if (i18nInstance.language) {
      handleLanguageChange(i18nInstance.language);
    }
    
    // Listen to changes
    if (i18nInstance.on && typeof i18nInstance.on === 'function') {
      i18nInstance.on('languageChanged', handleLanguageChange);
    }
    
    return () => {
      if (i18nInstance.off && typeof i18nInstance.off === 'function') {
        i18nInstance.off('languageChanged', handleLanguageChange);
      }
    };
  }, [i18nInstance]);
  
  /**
   * Translation function with parameter interpolation
   * Supports both {key} and {{key}} formats (backward compatible)
   * ✅ FIX: Add safety check for i18nT
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    // ✅ Safety: If i18nT is undefined, return key as fallback
    if (!i18nT || typeof i18nT !== 'function') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Translation function not ready for key: "${key}"`);
      }
      return key;
    }
    return i18nT(key, params as any) as string;
  };
  
  /**
   * Change language function
   */
  const changeLanguage = async (lang: LanguageCode): Promise<void> => {
    if (i18nInstance && typeof i18nInstance.changeLanguage === 'function') {
      await i18nInstance.changeLanguage(lang);
    }
  };
  
  /**
   * Set language (alias for changeLanguage - backward compatible)
   */
  const setLanguage = (lang: LanguageCode): void => {
    changeLanguage(lang);
  };
  
  /**
   * Get current language
   */
  const currentLanguage = (i18nInstance?.language || 'vi') as LanguageCode;
  const language = currentLanguage;
  
  /**
   * Translate function (alias for t - backward compatible)
   */
  const translate = t;
  
  return {
    // New API (react-i18next standard)
    t,
    i18n: i18nInstance,
    ready: i18nInstance?.isInitialized ?? false,
    
    // Old API (backward compatible)
    currentLanguage,
    changeLanguage,
    language,
    setLanguage,
    translate,
  };
}

/**
 * Hook to get current language
 * ⚠️ NOTE: This returns just the language code string (e.g., "vi", "en")
 * For the full API with { t, language, changeLanguage }, use useTranslation()
 */
export function useCurrentLanguage() {
  const { language } = useTranslation();
  return language as LanguageCode;
}

/**
 * Hook to change language
 */
export function useChangeLanguage() {
  const { changeLanguage } = useTranslation();
  return changeLanguage;
}

// Export provider as default
export default I18nextProvider;