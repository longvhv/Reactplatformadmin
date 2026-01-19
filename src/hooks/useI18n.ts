/**
 * Custom i18n Hooks
 * Enhanced hooks for working with translations
 * Phase 2 - 2026-01-16
 */

import { useTranslation as useI18nextTranslation } from '../providers/LanguageProvider';
import { useMemo, useCallback } from 'react';
import type { LanguageCode } from '../constants/languages';

/**
 * Enhanced useTranslation hook with utility functions
 */
export function useI18n() {
  const { t, i18n, language, changeLanguage } = useI18nextTranslation();
  
  /**
   * Translate with fallback
   */
  const tWithFallback = useCallback((
    key: string,
    fallback: string,
    params?: Record<string, any>
  ): string => {
    const translation = t(key, params);
    return translation === key ? fallback : translation;
  }, [t]);
  
  /**
   * Translate multiple keys at once
   */
  const tMultiple = useCallback((keys: string[]): Record<string, string> => {
    return keys.reduce((acc, key) => {
      acc[key] = t(key);
      return acc;
    }, {} as Record<string, string>);
  }, [t]);
  
  /**
   * Check if a key exists
   */
  const exists = useCallback((key: string): boolean => {
    return i18n?.exists?.(key) ?? false;
  }, [i18n]);
  
  /**
   * Get current language name
   */
  const languageName = useMemo(() => {
    const names: Record<LanguageCode, string> = {
      vi: 'Tiếng Việt',
      en: 'English',
      es: 'Español',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
    };
    return names[language as LanguageCode] || 'Unknown';
  }, [language]);
  
  /**
   * Check if current language is RTL
   */
  const isRTL = useMemo(() => {
    // Add RTL languages here if needed
    const rtlLanguages: LanguageCode[] = [];
    return rtlLanguages.includes(language as LanguageCode);
  }, [language]);
  
  return {
    // Standard functions
    t,
    i18n,
    language: language as LanguageCode,
    changeLanguage,
    
    // Enhanced functions
    tWithFallback,
    tMultiple,
    exists,
    
    // Utility values
    languageName,
    isRTL,
  };
}

/**
 * Hook for formatted dates with i18n
 */
export function useI18nDate() {
  const { language } = useI18n();
  
  const formatDate = useCallback((
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    return new Intl.DateTimeFormat(language, options).format(dateObj);
  }, [language]);
  
  const formatRelativeTime = useCallback((
    date: Date | string | number
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }, [language]);
  
  return {
    formatDate,
    formatRelativeTime,
  };
}

/**
 * Hook for formatted numbers with i18n
 */
export function useI18nNumber() {
  const { language } = useI18n();
  
  const formatNumber = useCallback((
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(language, options).format(value);
  }, [language]);
  
  const formatCurrency = useCallback((
    value: number,
    currency: string = 'VND'
  ): string => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(value);
  }, [language]);
  
  const formatPercent = useCallback((
    value: number,
    decimals: number = 0
  ): string => {
    return new Intl.NumberFormat(language, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }, [language]);
  
  const formatCompact = useCallback((
    value: number
  ): string => {
    return new Intl.NumberFormat(language, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  }, [language]);
  
  return {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatCompact,
  };
}

/**
 * Hook for pluralization
 */
export function useI18nPlural() {
  const { t, language } = useI18n();
  
  const plural = useCallback((
    key: string,
    count: number,
    params?: Record<string, any>
  ): string => {
    return t(key, { count, ...params });
  }, [t]);
  
  const pluralRules = useMemo(() => {
    return new Intl.PluralRules(language);
  }, [language]);
  
  const getPluralForm = useCallback((count: number): Intl.LDMLPluralRule => {
    return pluralRules.select(count);
  }, [pluralRules]);
  
  return {
    plural,
    getPluralForm,
  };
}

/**
 * Hook for list formatting
 */
export function useI18nList() {
  const { language } = useI18n();
  
  const formatList = useCallback((
    items: string[],
    type: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
  ): string => {
    return new Intl.ListFormat(language, { type }).format(items);
  }, [language]);
  
  return {
    formatList,
  };
}

/**
 * Example usage in components:
 * 
 * const { t, tWithFallback, exists } = useI18n();
 * const { formatDate, formatRelativeTime } = useI18nDate();
 * const { formatCurrency, formatCompact } = useI18nNumber();
 * const { plural } = useI18nPlural();
 * const { formatList } = useI18nList();
 */
