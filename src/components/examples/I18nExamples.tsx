/**
 * i18n Examples Component
 * Demonstrates all i18n features and best practices
 * Phase 2 - 2026-01-16
 * 
 * This component showcases:
 * - Basic translations
 * - Trans component with HTML
 * - Pluralization
 * - Date/Number formatting
 * - Custom hooks
 */

import React, { useState } from 'react';
import { useI18n, useI18nDate, useI18nNumber, useI18nPlural, useI18nList } from '../../hooks/useI18n';
import { Trans } from '../i18n/Trans';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function I18nExamples() {
  const { t, language, languageName, changeLanguage, tWithFallback, exists } = useI18n();
  const { formatDate, formatRelativeTime } = useI18nDate();
  const { formatNumber, formatCurrency, formatPercent, formatCompact } = useI18nNumber();
  const { plural } = useI18nPlural();
  const { formatList } = useI18nList();
  
  const [itemCount, setItemCount] = useState(5);
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">i18n Examples & Features</h1>
        <div className="flex gap-2">
          {(['vi', 'en', 'es', 'zh', 'ja', 'ko'] as const).map(lng => (
            <Button
              key={lng}
              variant={language === lng ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLanguage(lng)}
            >
              {lng.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Current Language: <strong>{languageName}</strong> ({language})
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Translations */}
        <Card>
          <CardHeader>
            <CardTitle>1. Basic Translations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">t('common.save')</code>
              <p className="mt-1">{t('common.save')}</p>
            </div>
            <div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">t('common.cancel')</code>
              <p className="mt-1">{t('common.cancel')}</p>
            </div>
            <div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">t('common.loading')</code>
              <p className="mt-1">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Trans Component */}
        <Card>
          <CardHeader>
            <CardTitle>2. Trans Component (HTML in translations)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">With HTML tags:</p>
              <Trans i18nKey="welcome">
                Welcome <strong>back</strong>!
              </Trans>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">With variables:</p>
              <Trans 
                i18nKey="userGreeting"
                values={{ name: 'John Doe', role: 'Admin' }}
              >
                Hello <strong>{'{{name}}'}</strong>, you are logged in as {'{{role}}'}
              </Trans>
            </div>
          </CardContent>
        </Card>
        
        {/* Interpolation */}
        <Card>
          <CardHeader>
            <CardTitle>3. Variable Interpolation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                t('common.welcome', {'{'} name: 'John' {'}'})
              </code>
              <p className="mt-1">{t('common.welcome', { name: 'John' })}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Pluralization */}
        <Card>
          <CardHeader>
            <CardTitle>4. Pluralization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setItemCount(Math.max(0, itemCount - 1))}>-</Button>
              <span className="w-16 text-center">{itemCount}</span>
              <Button size="sm" onClick={() => setItemCount(itemCount + 1)}>+</Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Result:</p>
              <p className="mt-1">{plural('common.item', itemCount)}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Date Formatting */}
        <Card>
          <CardHeader>
            <CardTitle>5. Date Formatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Full Date:</p>
              <p>{formatDate(new Date(), { 
                dateStyle: 'full',
                timeStyle: 'short'
              })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Relative Time:</p>
              <p>{formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000))}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Number Formatting */}
        <Card>
          <CardHeader>
            <CardTitle>6. Number Formatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Number:</p>
              <p>{formatNumber(1234567.89)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency (VND):</p>
              <p>{formatCurrency(1234567, 'VND')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Percent:</p>
              <p>{formatPercent(0.8567, 2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compact:</p>
              <p>{formatCompact(1234567)}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* List Formatting */}
        <Card>
          <CardHeader>
            <CardTitle>7. List Formatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Conjunction (and):</p>
              <p>{formatList(['Apple', 'Banana', 'Orange'], 'conjunction')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disjunction (or):</p>
              <p>{formatList(['Red', 'Green', 'Blue'], 'disjunction')}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Advanced Features */}
        <Card>
          <CardHeader>
            <CardTitle>8. Advanced Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">With Fallback:</p>
              <p>{tWithFallback('nonexistent.key', 'Fallback Text')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check Key Exists:</p>
              <p>
                common.save exists: {exists('common.save') ? '✅' : '❌'}<br />
                fake.key exists: {exists('fake.key') ? '✅' : '❌'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Developer Tools */}
      <Card className="bg-gray-900 text-white">
        <CardHeader>
          <CardTitle>🛠️ Developer Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">Open browser console and try:</p>
          <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto">
{`// Show all available tools
window.i18nDevTools.help()

// Log i18n statistics
window.i18nDevTools.logI18nStats()

// Find missing keys
window.i18nDevTools.findMissingKeys()

// Get translation coverage
window.i18nDevTools.getTranslationCoverage()

// Export translations
window.i18nDevTools.exportTranslations('vi')`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default I18nExamples;
