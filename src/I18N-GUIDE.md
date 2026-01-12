# Internationalization (i18n) Guide

## 🌍 Supported Languages

The VHV Platform supports 6 languages:

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| Vietnamese | `vi` | Tiếng Việt | 🇻🇳 |
| English | `en` | English | 🇺🇸 |
| Spanish | `es` | Español | 🇪🇸 |
| Chinese | `zh` | 中文 | 🇨🇳 |
| Japanese | `ja` | 日本語 | 🇯🇵 |
| Korean | `ko` | 한국어 | 🇰🇷 |

## 🚀 Quick Start

### 1. Using Translations in Components

```tsx
import { useTranslation } from './providers/LanguageProvider';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t.common.welcome}</h1>
      <p>{t.common.hello}</p>
      <button>{t.common.save}</button>
    </div>
  );
}
```

### 2. Dynamic Translations with Parameters

```tsx
import { useTranslation } from './providers/LanguageProvider';

function ValidationExample() {
  const { translate } = useTranslation();
  
  const emailError = translate('validation.required', { field: 'Email' });
  const minLengthError = translate('validation.minLength', { 
    field: 'Password', 
    min: 8 
  });
  
  return (
    <div>
      <p>{emailError}</p> {/* "Please enter Email" */}
      <p>{minLengthError}</p> {/* "Password must be at least 8 characters" */}
    </div>
  );
}
```

### 3. Changing Language

```tsx
import { useLanguage } from './providers/LanguageProvider';

function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      <option value="vi">Tiếng Việt</option>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="zh">中文</option>
      <option value="ja">日本語</option>
      <option value="ko">한국어</option>
    </select>
  );
}
```

### 4. Using Language Switcher Component

```tsx
import { LanguageSwitcher } from './components/common';

function Header() {
  return (
    <header>
      <nav>
        {/* Other header content */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

## 📁 File Structure

```
/
├── i18n/
│   ├── vi.ts          # Vietnamese translations
│   ├── en.ts          # English translations
│   ├── es.ts          # Spanish translations
│   ├── zh.ts          # Chinese translations
│   ├── ja.ts          # Japanese translations
│   ├── ko.ts          # Korean translations
│   └── index.ts       # Export all translations
│
├── constants/
│   └── languages.ts   # Language configurations
│
├── providers/
│   └── LanguageProvider.tsx   # i18n context provider
│
└── components/
    └── common/
        └── LanguageSwitcher.tsx   # Language switcher UI
```

## 🎯 Translation Structure

### Translation Keys Hierarchy

```typescript
{
  common: {
    hello: 'Xin chào',
    welcome: 'Chào mừng',
    save: 'Lưu',
    // ... other common translations
  },
  
  navigation: {
    dashboard: 'Trang chủ',
    profile: 'Hồ sơ',
    // ... navigation items
  },
  
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    // ... auth-related translations
  },
  
  profile: {
    title: 'Hồ sơ cá nhân',
    personalInfo: 'Thông tin cá nhân',
    // ... profile-related translations
  },
  
  // ... other categories
}
```

## 🔧 API Reference

### useLanguage Hook

```typescript
const {
  language,      // Current language code: 'vi' | 'en' | 'es' | 'zh' | 'ja' | 'ko'
  setLanguage,   // Function to change language
  t,             // Translation object (typed)
  translate,     // Function for dynamic translations
} = useLanguage();
```

### useTranslation Hook

```typescript
const {
  t,           // Translation object (typed)
  translate,   // Function for dynamic translations
} = useTranslation();
```

### translate Function

```typescript
translate(key: string, params?: Record<string, string | number>): string

// Examples:
translate('common.hello')
translate('validation.required', { field: 'Email' })
translate('validation.minLength', { field: 'Password', min: 8 })
```

## ✨ Features

### 1. **Type-Safe Translations**

All translations are fully typed with TypeScript:

```typescript
const { t } = useTranslation();

// ✅ Auto-complete works
t.common.hello
t.profile.personalInfo

// ❌ TypeScript error - key doesn't exist
t.common.nonExistent
```

### 2. **Parameter Substitution**

Replace placeholders in translation strings:

```typescript
// Translation: "{{field}} must be at least {{min}} characters"
translate('validation.minLength', { field: 'Password', min: 8 })
// Result: "Password must be at least 8 characters"
```

### 3. **Persistent Language Preference**

Language selection is saved to localStorage and persists across sessions.

### 4. **HTML Lang Attribute**

The HTML `lang` attribute is automatically updated when language changes:

```html
<html lang="vi">  <!-- Auto-updated -->
```

### 5. **Dot Notation Support**

Access nested translations using dot notation:

```typescript
translate('common.hello')
translate('profile.personalInfo')
translate('errors.networkError')
```

## 📝 Adding a New Language

### Step 1: Add Language Config

```typescript
// constants/languages.ts
export const SUPPORTED_LANGUAGES: Language[] = [
  // ... existing languages
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
];
```

### Step 2: Create Translation File

```typescript
// i18n/fr.ts
import { TranslationKeys } from './vi';

export const fr: TranslationKeys = {
  common: {
    hello: 'Bonjour',
    welcome: 'Bienvenue',
    // ... translate all keys
  },
  // ... other categories
};
```

### Step 3: Export Translation

```typescript
// i18n/index.ts
import { fr } from './fr';

export const translations: Record<LanguageCode, TranslationKeys> = {
  vi,
  en,
  es,
  zh,
  ja,
  ko,
  fr, // Add new language
};
```

## 🎨 Best Practices

### 1. **Use Translation Keys Consistently**

```tsx
// ✅ Good - Use translation keys
<h1>{t.dashboard.title}</h1>
<p>{t.dashboard.welcome}</p>

// ❌ Bad - Hard-coded text
<h1>Dashboard</h1>
<p>Welcome back</p>
```

### 2. **Group Related Translations**

```typescript
// ✅ Good - Organized by feature
{
  profile: {
    title: '...',
    personalInfo: '...',
    security: '...',
  }
}

// ❌ Bad - Flat structure
{
  profileTitle: '...',
  profilePersonalInfo: '...',
  profileSecurity: '...',
}
```

### 3. **Use Parameters for Dynamic Content**

```typescript
// ✅ Good - Parameterized
translate('validation.minLength', { field: fieldName, min: 8 })

// ❌ Bad - String concatenation
`${fieldName} must be at least 8 characters`
```

### 4. **Keep Translations Short and Clear**

```typescript
// ✅ Good
save: 'Save'
cancel: 'Cancel'

// ❌ Bad - Too verbose
save: 'Click here to save your changes'
cancel: 'Click this button to cancel the operation'
```

## 🔍 Common Use Cases

### 1. Form Validation Messages

```tsx
function LoginForm() {
  const { translate } = useTranslation();
  
  const validateEmail = (email: string) => {
    if (!email) {
      return translate('validation.required', { field: 'Email' });
    }
    if (!isValidEmail(email)) {
      return translate('validation.email');
    }
  };
  
  return <form>{/* ... */}</form>;
}
```

### 2. Error Messages

```tsx
function DataFetcher() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      // fetch data
    } catch (err) {
      setError(t.errors.networkError);
    }
  };
  
  return error && <div className="error">{error}</div>;
}
```

### 3. Navigation Items

```tsx
function Sidebar() {
  const { t } = useTranslation();
  
  const menuItems = [
    { label: t.navigation.dashboard, icon: Home },
    { label: t.navigation.profile, icon: User },
    { label: t.navigation.settings, icon: Settings },
  ];
  
  return <nav>{/* render menu items */}</nav>;
}
```

### 4. Time/Date Formatting

```tsx
function ActivityLog() {
  const { t } = useTranslation();
  
  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t.time.justNow;
    if (minutes < 60) return translate('time.minutesAgo', { count: minutes });
    // ... more logic
  };
  
  return <div>{formatTime(activity.date)}</div>;
}
```

## 🌐 RTL Support

For right-to-left languages (Arabic, Hebrew, etc.):

```typescript
// constants/languages.ts
{
  code: 'ar',
  name: 'Arabic',
  nativeName: 'العربية',
  flag: '🇸🇦',
  direction: 'rtl', // Right-to-left
}
```

The direction is stored and can be used for styling:

```tsx
const { language } = useLanguage();
const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

<div dir={currentLang?.direction}>
  {/* Content automatically adjusts for RTL */}
</div>
```

## 📊 Translation Coverage

### Check Translation Coverage

```typescript
// utils/checkTranslationCoverage.ts
import { translations } from '../i18n';

function checkCoverage() {
  const base = translations.vi;
  const languages = Object.keys(translations);
  
  languages.forEach(lang => {
    const missing = findMissingKeys(base, translations[lang]);
    console.log(`${lang}: ${missing.length} missing keys`);
  });
}
```

## 🎯 Performance Tips

### 1. **Lazy Load Translations**

For large applications, consider lazy loading translations:

```typescript
const loadTranslations = async (lang: LanguageCode) => {
  const module = await import(`./i18n/${lang}.ts`);
  return module[lang];
};
```

### 2. **Memoize Translations**

```typescript
import { useMemo } from 'react';

function MyComponent() {
  const { t } = useTranslation();
  
  const translatedItems = useMemo(() => ({
    title: t.common.title,
    description: t.common.description,
  }), [t]);
  
  return <div>{/* ... */}</div>;
}
```

## 🔗 Resources

- [MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [W3C: Language Tags](https://www.w3.org/International/articles/language-tags/)
- [Unicode CLDR](http://cldr.unicode.org/)

---

**Happy translating!** 🌍
