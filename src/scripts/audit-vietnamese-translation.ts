#!/usr/bin/env ts-node
/**
 * Vietnamese Translation Audit Script
 * Kiểm tra các translation keys còn thiếu trong file vi.ts
 * 
 * Usage:
 *   ts-node scripts/audit-vietnamese-translation.ts
 *   
 * Output:
 *   - Console report
 *   - /docs/i18n/translation-audit-report.md
 *   - /docs/i18n/missing-keys.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Import translation files
const EN_FILE = path.join(__dirname, '../i18n/en.ts');
const VI_FILE = path.join(__dirname, '../i18n/vi.ts');
const OUTPUT_MD = path.join(__dirname, '../docs/i18n/translation-audit-report.md');
const OUTPUT_JSON = path.join(__dirname, '../docs/i18n/missing-keys.json');

interface TranslationKey {
  key: string;
  path: string[];
  enValue?: string;
  viValue?: string;
  status: 'complete' | 'missing' | 'partial' | 'identical';
  priority: 'critical' | 'high' | 'medium' | 'low';
  module: string;
}

interface AuditReport {
  timestamp: string;
  summary: {
    total: number;
    complete: number;
    missing: number;
    partial: number;
    identical: number;
    completionRate: number;
  };
  byModule: Record<string, {
    total: number;
    complete: number;
    missing: number;
    completionRate: number;
  }>;
  byPriority: Record<string, number>;
  missingKeys: TranslationKey[];
  identicalKeys: TranslationKey[];
}

/**
 * Extract all keys from a nested object
 */
function extractKeys(
  obj: any,
  prefix: string[] = [],
  result: TranslationKey[] = []
): TranslationKey[] {
  for (const key in obj) {
    const currentPath = [...prefix, key];
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested object
      extractKeys(value, currentPath, result);
    } else {
      // Leaf node - this is a translation key
      result.push({
        key: currentPath.join('.'),
        path: currentPath,
        enValue: typeof value === 'string' ? value : undefined,
        status: 'complete',
        priority: determinePriority(currentPath),
        module: currentPath[0],
      });
    }
  }

  return result;
}

/**
 * Determine priority based on key path
 */
function determinePriority(path: string[]): 'critical' | 'high' | 'medium' | 'low' {
  const module = path[0];
  const key = path[path.length - 1];

  // Critical: Navigation, titles, primary actions
  if (module === 'navigation' || module === 'menu') return 'critical';
  if (key === 'title' || key === 'subtitle') return 'critical';
  if (['save', 'delete', 'create', 'update', 'submit', 'cancel'].includes(key)) {
    return 'critical';
  }

  // High: Error messages, validation, status
  if (module === 'errors' || module === 'validation') return 'high';
  if (key.includes('Error') || key.includes('Success')) return 'high';
  if (key === 'status' || key.includes('Status')) return 'high';

  // Medium: Descriptions, labels, placeholders
  if (key === 'description' || key === 'label') return 'medium';
  if (key.includes('Placeholder') || key.includes('Help')) return 'medium';

  // Low: Everything else
  return 'low';
}

/**
 * Load and parse translation file
 */
function loadTranslations(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove import statements and exports
    const cleaned = content
      .replace(/^import\s+.*$/gm, '')
      .replace(/^export\s+.*$/gm, '')
      .replace(/^\/\*\*[\s\S]*?\*\/$/gm, '')
      .trim();

    // Extract the object literal
    const match = cleaned.match(/const\s+\w+\s*=\s*({[\s\S]*});/);
    if (!match) {
      throw new Error(`Could not parse ${filePath}`);
    }

    // Use eval to parse (for development only!)
    // In production, use a proper TypeScript parser
    const obj = eval(`(${match[1]})`);
    return obj;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
}

/**
 * Compare EN and VI translations
 */
function compareTranslations(enKeys: TranslationKey[], viObj: any): TranslationKey[] {
  const results: TranslationKey[] = [];

  for (const enKey of enKeys) {
    // Navigate to the value in VI object
    let viValue: any = viObj;
    let exists = true;

    for (const part of enKey.path) {
      if (viValue && typeof viValue === 'object' && part in viValue) {
        viValue = viValue[part];
      } else {
        exists = false;
        break;
      }
    }

    const key: TranslationKey = {
      ...enKey,
      viValue: exists && typeof viValue === 'string' ? viValue : undefined,
      status: exists ? 'complete' : 'missing',
    };

    // Check if translation is identical to English (likely not translated)
    if (exists && key.viValue === key.enValue) {
      key.status = 'identical';
    }

    results.push(key);
  }

  return results;
}

/**
 * Generate audit report
 */
function generateReport(keys: TranslationKey[]): AuditReport {
  const timestamp = new Date().toISOString();

  // Summary stats
  const summary = {
    total: keys.length,
    complete: keys.filter(k => k.status === 'complete').length,
    missing: keys.filter(k => k.status === 'missing').length,
    partial: keys.filter(k => k.status === 'partial').length,
    identical: keys.filter(k => k.status === 'identical').length,
    completionRate: 0,
  };

  summary.completionRate = Math.round(
    ((summary.complete - summary.identical) / summary.total) * 100
  );

  // By module
  const byModule: Record<string, any> = {};
  for (const key of keys) {
    if (!byModule[key.module]) {
      byModule[key.module] = { total: 0, complete: 0, missing: 0, completionRate: 0 };
    }
    byModule[key.module].total++;
    if (key.status === 'complete' && key.status !== 'identical') {
      byModule[key.module].complete++;
    } else if (key.status === 'missing') {
      byModule[key.module].missing++;
    }
  }

  // Calculate completion rates
  for (const module in byModule) {
    const stats = byModule[module];
    stats.completionRate = Math.round((stats.complete / stats.total) * 100);
  }

  // By priority
  const byPriority: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const key of keys) {
    if (key.status === 'missing' || key.status === 'identical') {
      byPriority[key.priority]++;
    }
  }

  // Missing and identical keys
  const missingKeys = keys.filter(k => k.status === 'missing');
  const identicalKeys = keys.filter(k => k.status === 'identical');

  return {
    timestamp,
    summary,
    byModule,
    byPriority,
    missingKeys,
    identicalKeys,
  };
}

/**
 * Write Markdown report
 */
function writeMarkdownReport(report: AuditReport, filePath: string): void {
  const lines: string[] = [];

  lines.push('# VIETNAMESE TRANSLATION AUDIT REPORT');
  lines.push(`> Generated: ${new Date(report.timestamp).toLocaleString('vi-VN')}\n`);

  lines.push('---\n');

  // Summary
  lines.push('## 📊 TỔNG QUAN\n');
  lines.push('```');
  lines.push(`Tổng số keys:        ${report.summary.total}`);
  lines.push(`Đã dịch hoàn chỉnh:  ${report.summary.complete - report.summary.identical}`);
  lines.push(`Chưa dịch:           ${report.summary.missing}`);
  lines.push(`Giống tiếng Anh:    ${report.summary.identical}`);
  lines.push(`Tỷ lệ hoàn thành:    ${report.summary.completionRate}%`);
  lines.push('```\n');

  // Progress bar
  const barLength = 50;
  const filledLength = Math.round((report.summary.completionRate / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  lines.push('### Progress');
  lines.push('```');
  lines.push(`[${bar}] ${report.summary.completionRate}%`);
  lines.push('```\n');

  // By priority
  lines.push('## 🎯 PHÂN LOẠI THEO MỨC ĐỘ ƯU TIÊN\n');
  lines.push('Keys còn thiếu hoặc chưa dịch:\n');
  lines.push('| Priority | Count | Description |');
  lines.push('|----------|-------|-------------|');
  lines.push(`| 🔴 Critical | ${report.byPriority.critical} | Navigation, titles, primary actions |`);
  lines.push(`| 🟠 High | ${report.byPriority.high} | Errors, validations, status |`);
  lines.push(`| 🟡 Medium | ${report.byPriority.medium} | Descriptions, labels, helpers |`);
  lines.push(`| 🟢 Low | ${report.byPriority.low} | Secondary content |`);
  lines.push('');

  // By module
  lines.push('## 📦 PHÂN LOẠI THEO MODULE\n');
  lines.push('| Module | Total | Complete | Missing | Rate |');
  lines.push('|--------|-------|----------|---------|------|');

  const sortedModules = Object.entries(report.byModule).sort(
    ([, a], [, b]) => a.completionRate - b.completionRate
  );

  for (const [module, stats] of sortedModules) {
    const icon = stats.completionRate === 100 ? '✅' : 
                 stats.completionRate >= 80 ? '🟢' :
                 stats.completionRate >= 50 ? '🟡' : '🔴';
    lines.push(
      `| ${icon} ${module} | ${stats.total} | ${stats.complete} | ${stats.missing} | ${stats.completionRate}% |`
    );
  }
  lines.push('');

  // Missing keys by priority
  if (report.missingKeys.length > 0) {
    lines.push('## ❌ KEYS CHƯA DỊCH\n');

    const criticalMissing = report.missingKeys.filter(k => k.priority === 'critical');
    const highMissing = report.missingKeys.filter(k => k.priority === 'high');
    const mediumMissing = report.missingKeys.filter(k => k.priority === 'medium');
    const lowMissing = report.missingKeys.filter(k => k.priority === 'low');

    if (criticalMissing.length > 0) {
      lines.push('### 🔴 Critical Priority\n');
      lines.push('```typescript');
      for (const key of criticalMissing.slice(0, 20)) {
        lines.push(`${key.key}: '${key.enValue}',  // MISSING`);
      }
      if (criticalMissing.length > 20) {
        lines.push(`// ... and ${criticalMissing.length - 20} more`);
      }
      lines.push('```\n');
    }

    if (highMissing.length > 0) {
      lines.push('### 🟠 High Priority\n');
      lines.push('```typescript');
      for (const key of highMissing.slice(0, 20)) {
        lines.push(`${key.key}: '${key.enValue}',  // MISSING`);
      }
      if (highMissing.length > 20) {
        lines.push(`// ... and ${highMissing.length - 20} more`);
      }
      lines.push('```\n');
    }

    lines.push(`### Summary: ${report.missingKeys.length} keys cần dịch\n`);
  }

  // Identical keys (likely not translated)
  if (report.identicalKeys.length > 0) {
    lines.push('## ⚠️ KEYS GIỐNG TIẾNG ANH (CẦN KIỂM TRA)\n');
    lines.push('Các keys này có translation giống với tiếng Anh. Cần kiểm tra xem có nên dịch không.\n');

    lines.push('```typescript');
    for (const key of report.identicalKeys.slice(0, 30)) {
      lines.push(`${key.key}: '${key.viValue}',  // Same as EN`);
    }
    if (report.identicalKeys.length > 30) {
      lines.push(`// ... and ${report.identicalKeys.length - 30} more`);
    }
    lines.push('```\n');
  }

  // Next steps
  lines.push('## 📋 NEXT STEPS\n');
  lines.push('1. ✅ Review và approve audit report này');
  lines.push('2. 🔴 Ưu tiên dịch các Critical priority keys trước');
  lines.push('3. 🟠 Tiếp theo dịch High priority keys');
  lines.push('4. ⚠️ Review các keys giống tiếng Anh');
  lines.push('5. 🟡 Dịch Medium và Low priority keys');
  lines.push('6. ✅ Final QA và testing\n');

  lines.push('---\n');
  lines.push('*Tham khảo `/docs/i18n/VIETNAMESE_TRANSLATION_PLAN.md` để biết chi tiết kế hoạch dịch.*');

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Vietnamese Translation Audit\n');
  console.log('Loading translation files...');

  // Load translations
  const enObj = loadTranslations(EN_FILE);
  const viObj = loadTranslations(VI_FILE);

  console.log('✅ Files loaded\n');
  console.log('Extracting keys...');

  // Extract all EN keys
  const enKeys = extractKeys(enObj);
  console.log(`✅ Found ${enKeys.length} keys in en.ts\n`);

  console.log('Comparing translations...');

  // Compare with VI
  const comparedKeys = compareTranslations(enKeys, viObj);

  console.log('✅ Comparison complete\n');
  console.log('Generating report...');

  // Generate report
  const report = generateReport(comparedKeys);

  // Write outputs
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`✅ JSON report: ${OUTPUT_JSON}`);

  writeMarkdownReport(report, OUTPUT_MD);
  console.log(`✅ Markdown report: ${OUTPUT_MD}\n`);

  // Console summary
  console.log('📊 SUMMARY');
  console.log('─'.repeat(50));
  console.log(`Total keys:        ${report.summary.total}`);
  console.log(`Complete:          ${report.summary.complete - report.summary.identical}`);
  console.log(`Missing:           ${report.summary.missing}`);
  console.log(`Identical to EN:   ${report.summary.identical}`);
  console.log(`Completion rate:   ${report.summary.completionRate}%`);
  console.log('─'.repeat(50));

  console.log('\n🎯 PRIORITIES');
  console.log('─'.repeat(50));
  console.log(`🔴 Critical:       ${report.byPriority.critical} keys`);
  console.log(`🟠 High:           ${report.byPriority.high} keys`);
  console.log(`🟡 Medium:         ${report.byPriority.medium} keys`);
  console.log(`🟢 Low:            ${report.byPriority.low} keys`);
  console.log('─'.repeat(50));

  console.log('\n✅ Audit complete!');
  console.log(`\nView detailed report: ${OUTPUT_MD}`);
}

// Run
main();
