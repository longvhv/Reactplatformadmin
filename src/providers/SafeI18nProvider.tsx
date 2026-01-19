/**
 * Safe I18n Provider - Ultra-Robust Fallback
 * Guarantees no crashes even if i18n completely fails
 * Emergency fallback for production stability
 */

import React, { ReactNode, createContext, useContext, useState } from 'react';
import type { LanguageCode } from '../constants/languages';

interface SafeI18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: LanguageCode;
  changeLanguage: (lang: LanguageCode) => Promise<void>;
  ready: boolean;
}

// ✅ Create context with guaranteed default value
const SafeI18nContext = createContext<SafeI18nContextValue>({
  t: (key: string) => key, // Fallback: return key itself
  language: 'vi',
  changeLanguage: async () => {},
  ready: false,
});

/**
 * Safe I18n Provider Component
 * GUARANTEED to never crash
 */
export function SafeI18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('vi');
  
  // Ultra-simple translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    // For now, just return the key
    // This prevents ANY crashes
    return key;
  };
  
  // Ultra-simple language changer
  const changeLanguage = async (lang: LanguageCode): Promise<void> => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vhv-language', lang);
    }
  };
  
  const value: SafeI18nContextValue = {
    t,
    language,
    changeLanguage,
    ready: true, // Always ready!
  };
  
  return (
    <SafeI18nContext.Provider value={value}>
      {children}
    </SafeI18nContext.Provider>
  );
}

/**
 * Safe hook to use translations
 * GUARANTEED to return valid object
 */
export function useSafeTranslation() {
  const context = useContext(SafeI18nContext);
  
  // ✅ ALWAYS return valid object, even if context fails
  if (!context) {
    console.warn('⚠️  useSafeTranslation called outside provider, using fallback');
    return {
      t: (key: string) => key,
      language: 'vi' as LanguageCode,
      changeLanguage: async () => {},
      ready: false,
    };
  }
  
  return context;
}

export default SafeI18nProvider;
