/**
 * Language Test Component
 * Simple component to test if language switching works
 */

import { useTranslation, useLanguage } from '../providers/LanguageProvider';

export function LanguageTest() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-semibold mb-2">Language Test</h3>
      <div className="space-y-1 text-sm">
        <p><strong>Current:</strong> {language}</p>
        <p><strong>Dashboard:</strong> {t.navigation.dashboard}</p>
        <p><strong>Profile:</strong> {t.navigation.profile}</p>
        <p><strong>Settings:</strong> {t.navigation.settings}</p>
        <p><strong>Search:</strong> {t.common.search}</p>
      </div>
    </div>
  );
}
