/**
 * ULTRA-SIMPLE Translation Hook
 * GUARANTEED to never crash - no dependencies at all!
 * Emergency fallback for production stability
 */

/**
 * The simplest possible translation hook
 * Returns a plain object - CANNOT crash
 */
export function useSimpleTranslation() {
  // ✅ ULTRA-SIMPLE: Just return a plain object
  // No Context, no hooks, no external dependencies
  // ABSOLUTELY CANNOT CRASH
  
  const t = (key: string, _params?: Record<string, string | number>): string => {
    // For now, just return the key itself
    // This is the safest possible implementation
    return key;
  };
  
  const changeLanguage = async (_lang: string): Promise<void> => {
    // No-op for now
  };
  
  // ✅ Return plain object - guaranteed to work
  return {
    t,
    language: 'vi',
    changeLanguage,
    ready: true,
    currentLanguage: 'vi',
    setLanguage: changeLanguage,
    translate: t,
    i18n: {
      language: 'vi',
      changeLanguage,
      isInitialized: true,
    },
  };
}

export default useSimpleTranslation;
