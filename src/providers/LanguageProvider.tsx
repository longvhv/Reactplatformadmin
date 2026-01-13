'use client';

/**
 * Language Provider
 * Provides i18n context to the application
 * Last updated: 2026-01-08 - Fixed translation imports
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, TranslationKeys } from '../i18n/index';
import { 
  LanguageCode, 
  DEFAULT_LANGUAGE, 
  LANGUAGE_STORAGE_KEY 
} from '../constants/languages';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  changeLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translate: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Replace placeholders in translation string
 * Supports both {key} and {{key}} formats
 */
function replacePlaceholders(
  text: string,
  params?: Record<string, string | number>
): string {
  if (!params) return text;

  return Object.entries(params).reduce((result, [key, value]) => {
    // Support both {key} and {{key}} formats
    const singleBraceRegex = new RegExp(`{${key}}`, 'g');
    const doubleBraceRegex = new RegExp(`{{${key}}}`, 'g');
    return result
      .replace(singleBraceRegex, String(value))
      .replace(doubleBraceRegex, String(value));
  }, text);
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get saved language from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
      if (saved) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  /**
   * Translate function with dot notation support
   * Usage: t('common.hello') or t('validation.required', { field: 'Email' })
   */
  const translate = (key: string, params?: Record<string, string | number>): string => {
    const currentTranslations = translations[language];
    const translation = getNestedProperty(currentTranslations, key);
    
    if (translation === undefined) {
      console.warn(`❌ Translation not found for key: ${key} in language: ${language}`);
      return key;
    }

    return replacePlaceholders(String(translation), params);
  };

  const value: LanguageContextType = {
    currentLanguage: language,
    changeLanguage: setLanguage,
    t: translate,
    language,
    setLanguage,
    translate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage Hook
 * Access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  
  return context;
}

/**
 * useTranslation Hook
 * Simplified translation hook
 */
export function useTranslation() {
  const { t, translate } = useLanguage();
  
  return { t, translate };
}