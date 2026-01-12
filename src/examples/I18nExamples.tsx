/**
 * i18n Examples
 * Demonstrate internationalization usage
 */

import { useTranslation, useLanguage } from '../providers/LanguageProvider';
import { LanguageSwitcher } from '../components/common';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

/**
 * Example 1: Basic Translation
 */
export function BasicTranslationExample() {
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Basic Translation</h3>
      <div className="space-y-2">
        <p>{t.common.hello}</p>
        <p>{t.common.welcome}</p>
        <div className="flex gap-2">
          <Button>{t.common.save}</Button>
          <Button variant="outline">{t.common.cancel}</Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Example 2: Dynamic Translation with Parameters
 */
export function DynamicTranslationExample() {
  const { translate } = useTranslation();
  const [fieldName, setFieldName] = useState('Email');
  const [minLength, setMinLength] = useState(8);

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Dynamic Translation</h3>
      <div className="space-y-4">
        <div>
          <Label>Field Name</Label>
          <Input
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Field name"
          />
        </div>
        <div>
          <Label>Minimum Length</Label>
          <Input
            type="number"
            value={minLength}
            onChange={(e) => setMinLength(parseInt(e.target.value))}
          />
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            {translate('validation.minLength', { field: fieldName, min: minLength })}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Example 3: Language Switcher
 */
export function LanguageSwitcherExample() {
  const { language } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Language Switcher</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Language</p>
            <p className="text-lg">
              {currentLang?.flag} {currentLang?.nativeName}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </Card>
  );
}

/**
 * Example 4: Form Validation
 */
export function FormValidationExample() {
  const { t, translate } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = translate('validation.required', { field: t.auth.email });
    }

    if (!password) {
      newErrors.password = translate('validation.required', { field: t.auth.password });
    } else if (password.length < 8) {
      newErrors.password = translate('validation.minLength', { 
        field: t.auth.password, 
        min: 8 
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      alert(t.auth.loginSuccess);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Form Validation</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t.auth.email}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label>{t.auth.password}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.auth.password}
          />
          {errors.password && (
            <p className="text-sm text-destructive mt-1">{errors.password}</p>
          )}
        </div>

        <Button type="submit">{t.auth.login}</Button>
      </form>
    </Card>
  );
}

/**
 * Example 5: Navigation Menu
 */
export function NavigationMenuExample() {
  const { t } = useTranslation();

  const menuItems = [
    { label: t.navigation.dashboard, href: '/dashboard' },
    { label: t.navigation.profile, href: '/profile' },
    { label: t.navigation.settings, href: '/settings' },
    { label: t.navigation.help, href: '/help' },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Navigation Menu</h3>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </Card>
  );
}

/**
 * Example 6: Time Formatting
 */
export function TimeFormattingExample() {
  const { translate } = useTranslation();

  const formatTime = (minutesAgo: number) => {
    if (minutesAgo < 1) return translate('time.justNow');
    if (minutesAgo < 60) return translate('time.minutesAgo', { count: minutesAgo });
    const hours = Math.floor(minutesAgo / 60);
    if (hours < 24) return translate('time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return translate('time.daysAgo', { count: days });
  };

  const activities = [
    { action: 'Login', time: 0 },
    { action: 'Updated profile', time: 15 },
    { action: 'Changed password', time: 120 },
    { action: 'Created post', time: 1440 },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Time Formatting</h3>
      <div className="space-y-2">
        {activities.map((activity, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <span>{activity.action}</span>
            <span className="text-sm text-muted-foreground">
              {formatTime(activity.time)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Example 7: All Languages Display
 */
export function AllLanguagesExample() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">All Supported Languages</h3>
      <div className="grid grid-cols-2 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`p-4 rounded-lg border-2 transition-all ${
              language === lang.code
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-2xl mb-2">{lang.flag}</div>
            <div className="font-medium">{lang.nativeName}</div>
            <div className="text-sm text-muted-foreground">{lang.name}</div>
            {language === lang.code && (
              <div className="mt-2 text-xs text-primary font-medium">
                {t.common.select}ed
              </div>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

/**
 * Main Examples Page
 */
export function I18nExamplesPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">
          {t.common.welcome} - i18n Examples
        </h1>
        <p className="text-muted-foreground">
          Real-world examples of internationalization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicTranslationExample />
        <DynamicTranslationExample />
        <LanguageSwitcherExample />
        <FormValidationExample />
        <NavigationMenuExample />
        <TimeFormattingExample />
        <div className="lg:col-span-2">
          <AllLanguagesExample />
        </div>
      </div>
    </div>
  );
}
