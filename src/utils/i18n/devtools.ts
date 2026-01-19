/**
 * i18n Development Tools
 * Utilities for debugging and development
 * Phase 2 - 2026-01-16
 */

import i18n from '../../i18n/config';
import type { LanguageCode } from '../../constants/languages';

/**
 * Get all translation keys for a language
 */
export function getAllKeys(lng: LanguageCode = 'vi'): string[] {
  const resources = i18n.getResourceBundle(lng, 'translation');
  return flattenObject(resources);
}

/**
 * Flatten nested object to dot notation keys
 */
function flattenObject(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...flattenObject(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Find missing translation keys across languages
 */
export function findMissingKeys(): Record<LanguageCode, string[]> {
  const languages: LanguageCode[] = ['vi', 'en', 'es', 'zh', 'ja', 'ko'];
  const allKeys: Record<LanguageCode, Set<string>> = {} as any;
  
  // Get all keys for each language
  languages.forEach(lng => {
    allKeys[lng] = new Set(getAllKeys(lng));
  });
  
  // Find missing keys (keys in vi but not in other languages)
  const viKeys = allKeys.vi;
  const missing: Record<LanguageCode, string[]> = {} as any;
  
  languages.forEach(lng => {
    if (lng === 'vi') return;
    
    missing[lng] = Array.from(viKeys).filter(key => !allKeys[lng].has(key));
  });
  
  return missing;
}

/**
 * Find unused translation keys (keys not used in code)
 * Note: This is a simple check, may have false positives
 */
export function findUnusedKeys(usedKeys: string[]): string[] {
  const allKeys = getAllKeys('vi');
  const usedSet = new Set(usedKeys);
  
  return allKeys.filter(key => !usedSet.has(key));
}

/**
 * Validate translation key exists
 */
export function validateKey(key: string, lng?: LanguageCode): boolean {
  return i18n.exists(key, { lng });
}

/**
 * Get translation coverage percentage
 */
export function getTranslationCoverage(): Record<LanguageCode, number> {
  const languages: LanguageCode[] = ['vi', 'en', 'es', 'zh', 'ja', 'ko'];
  const viKeys = getAllKeys('vi');
  const totalKeys = viKeys.length;
  
  const coverage: Record<LanguageCode, number> = {} as any;
  
  languages.forEach(lng => {
    const lngKeys = getAllKeys(lng);
    coverage[lng] = Math.round((lngKeys.length / totalKeys) * 100);
  });
  
  return coverage;
}

/**
 * Log i18n statistics to console
 */
export function logI18nStats(): void {
  console.group('📊 i18n Statistics');
  
  // Current language
  console.log('Current Language:', i18n.language);
  
  // Total keys
  const totalKeys = getAllKeys('vi').length;
  console.log('Total Translation Keys:', totalKeys);
  
  // Coverage
  const coverage = getTranslationCoverage();
  console.table(coverage);
  
  // Missing keys
  const missing = findMissingKeys();
  const hasMissing = Object.values(missing).some(arr => arr.length > 0);
  
  if (hasMissing) {
    console.warn('⚠️ Missing Keys:');
    Object.entries(missing).forEach(([lng, keys]) => {
      if (keys.length > 0) {
        console.warn(`  ${lng}: ${keys.length} keys missing`);
        console.log('    First 5:', keys.slice(0, 5));
      }
    });
  } else {
    console.log('✅ No missing keys');
  }
  
  console.groupEnd();
}

/**
 * Watch for missing translation keys in development
 */
export function watchMissingKeys(): () => void {
  if (process.env.NODE_ENV !== 'development') {
    return () => {};
  }
  
  const handler = (lngs: readonly string[], namespace: string, key: string) => {
    console.warn(
      `❌ Missing translation key: "${key}" for languages: ${lngs.join(', ')}`
    );
  };
  
  i18n.on('missingKey', handler);
  
  // Return cleanup function
  return () => {
    i18n.off('missingKey', handler);
  };
}

/**
 * Export translations to JSON for external tools
 */
export function exportTranslations(lng: LanguageCode = 'vi'): string {
  const resources = i18n.getResourceBundle(lng, 'translation');
  return JSON.stringify(resources, null, 2);
}

/**
 * Compare two language files and show differences
 */
export function compareLanguages(lng1: LanguageCode, lng2: LanguageCode): {
  inLng1NotLng2: string[];
  inLng2NotLng1: string[];
  common: string[];
} {
  const keys1 = new Set(getAllKeys(lng1));
  const keys2 = new Set(getAllKeys(lng2));
  
  return {
    inLng1NotLng2: Array.from(keys1).filter(k => !keys2.has(k)),
    inLng2NotLng1: Array.from(keys2).filter(k => !keys1.has(k)),
    common: Array.from(keys1).filter(k => keys2.has(k)),
  };
}

/**
 * Development helper: Log all available functions
 */
export function help(): void {
  console.log(`
📚 i18n Development Tools

Available Functions:
  - getAllKeys(lng?)           Get all translation keys for a language
  - findMissingKeys()          Find missing keys across languages
  - findUnusedKeys(usedKeys)   Find potentially unused keys
  - validateKey(key, lng?)     Check if a key exists
  - getTranslationCoverage()   Get coverage % for each language
  - logI18nStats()            Log comprehensive i18n statistics
  - watchMissingKeys()        Watch for missing keys (dev only)
  - exportTranslations(lng?)   Export translations as JSON
  - compareLanguages(lng1, lng2) Compare two languages
  - help()                    Show this help message

Usage in Browser Console:
  import * as i18nDev from './utils/i18n/devtools';
  i18nDev.logI18nStats();
  i18nDev.findMissingKeys();
  `);
}

// Auto-watch in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make tools available globally for debugging
  (window as any).i18nDevTools = {
    getAllKeys,
    findMissingKeys,
    findUnusedKeys,
    validateKey,
    getTranslationCoverage,
    logI18nStats,
    watchMissingKeys,
    exportTranslations,
    compareLanguages,
    help,
  };
  
  console.log('💡 i18n DevTools available: window.i18nDevTools.help()');
}
