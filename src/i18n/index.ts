/**
 * i18n Index
 * Export all translations
 * Last updated: 2026-01-08
 */

import vi from './vi';
import en from './en';
import es from './es';
import ja from './ja';
import ko from './ko';
import zh from './zh';
import type { LanguageCode } from '../constants/languages';
import type { TranslationKeys } from './vi';

// Create translations object with proper typing
export const translations: Record<LanguageCode, TranslationKeys> = {
  vi: vi,
  en: en,
  es: es,
  zh: zh,
  ja: ja,
  ko: ko,
};

export type { TranslationKeys };