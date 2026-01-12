/**
 * Test file to verify translations import correctly
 */

import { vi } from './i18n/vi';
import { en } from './i18n/en';
import { translations } from './i18n';

console.log('=== TRANSLATION TEST ===');
console.log('Direct vi import:', {
  exists: !!vi,
  hasNavigation: !!vi.navigation,
  hasProfile: !!vi.profile,
  navigationKeys: vi.navigation ? Object.keys(vi.navigation) : 'N/A',
  profileKeys: vi.profile ? Object.keys(vi.profile) : 'N/A',
  devDocs: vi.navigation?.devDocs,
  settings: vi.navigation?.settings,
  logout: vi.navigation?.logout,
  profileTitle: vi.profile?.title,
});

console.log('Direct en import:', {
  exists: !!en,
  hasNavigation: !!en.navigation,
  hasProfile: !!en.profile,
});

console.log('Translations object:', {
  exists: !!translations,
  languages: Object.keys(translations),
  viFromTranslations: !!translations.vi,
  viNavigationFromTranslations: !!(translations.vi as any)?.navigation,
});

console.log('Specific values from translations.vi:', {
  devDocs: (translations.vi as any)?.navigation?.devDocs,
  settings: (translations.vi as any)?.navigation?.settings,
  logout: (translations.vi as any)?.navigation?.logout,
  profileTitle: (translations.vi as any)?.profile?.title,
});
