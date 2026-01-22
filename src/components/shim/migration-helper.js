#!/usr/bin/env node

/**
 * Migration Helper Script
 * 
 * Script này giúp tự động hóa việc find/replace imports khi migration sang Next.js.
 * 
 * USAGE:
 * node shim-migration-helper.js --check    # Kiểm tra xem có bao nhiêu files cần update
 * node shim-migration-helper.js --migrate  # Thực hiện migration (backup trước!)
 * node shim-migration-helper.js --revert   # Revert về shim (từ backup)
 * 
 * REQUIREMENTS:
 * - Node.js 16+
 * - Đã commit code hoặc có backup
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PATTERNS = [
  // Navigation imports
  {
    name: 'useRouter from shim',
    find: /from ['"](.*)\/shim\/next-navigation['"]/g,
    replace: "from 'next/navigation'",
  },
  {
    name: 'useRouter from shim index',
    find: /from ['"](.*)\/shim['"]/g,
    replace: "from 'next/navigation'",
  },
  // Link component (special case - different import in Next.js)
  {
    name: 'Link component',
    find: /import \{([^}]*?)\bLink\b([^}]*?)\} from ['"](.*)\/shim/g,
    replace: (match, before, after, relativePath) => {
      // Extract other imports (not Link)
      const others = (before + after).split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'Link');
      
      let result = '';
      // Import Link separately
      result += "import Link from 'next/link';\n";
      
      // Import others from next/navigation if any
      if (others.length > 0) {
        result += `import { ${others.join(', ')} } from 'next/navigation'`;
      }
      
      return result;
    },
  },
  // Remove ParamsProvider (not needed in Next.js)
  {
    name: 'ParamsProvider import',
    find: /import \{[^}]*?\bParamsProvider\b[^}]*?\} from ['"](.*)\/shim[^'"]*['"];?\n?/g,
    replace: '// ParamsProvider removed - not needed in Next.js\n',
  },
  {
    name: 'ParamsProvider usage',
    find: /<ParamsProvider[^>]*>[\s\S]*?<\/ParamsProvider>/g,
    replace: (match) => {
      // Extract children
      const childrenMatch = match.match(/<ParamsProvider[^>]*>([\s\S]*?)<\/ParamsProvider>/);
      return childrenMatch ? childrenMatch[1] : match;
    },
  },
];

const DIRECTORIES_TO_SCAN = [
  './app',
  './components',
  './core',
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ============================================================================
// UTILITIES
// ============================================================================

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [];

  PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.find, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        pattern: pattern.name,
        line: content.substring(0, match.index).split('\n').length,
        match: match[0],
      });
    }
  });

  return matches;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  PATTERNS.forEach((pattern) => {
    const before = content;
    content = content.replace(pattern.find, pattern.replace);
    if (before !== content) {
      changed = true;
    }
  });

  if (changed) {
    // Create backup
    const backupPath = filePath + '.shim-backup';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    
    // Write migrated content
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

function revertFile(filePath) {
  const backupPath = filePath + '.shim-backup';
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
    return true;
  }
  return false;
}

// ============================================================================
// COMMANDS
// ============================================================================

function checkCommand() {
  console.log('🔍 Scanning for shim imports...\n');

  const allFiles = [];
  DIRECTORIES_TO_SCAN.forEach((dir) => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });

  const results = {};
  let totalMatches = 0;

  allFiles.forEach((filePath) => {
    const matches = scanFile(filePath);
    if (matches.length > 0) {
      results[filePath] = matches;
      totalMatches += matches.length;
    }
  });

  // Print results
  Object.keys(results).forEach((filePath) => {
    console.log(`📄 ${filePath}`);
    results[filePath].forEach((match) => {
      console.log(`   Line ${match.line}: ${match.pattern}`);
      console.log(`   ${match.match}`);
    });
    console.log('');
  });

  console.log(`✅ Found ${totalMatches} patterns in ${Object.keys(results).length} files`);
  console.log('\n💡 Run with --migrate to update files (will create backups)');
}

function migrateCommand() {
  console.log('🚀 Starting migration...\n');

  const allFiles = [];
  DIRECTORIES_TO_SCAN.forEach((dir) => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });

  let migratedCount = 0;

  allFiles.forEach((filePath) => {
    const changed = migrateFile(filePath);
    if (changed) {
      console.log(`✅ Migrated: ${filePath}`);
      migratedCount++;
    }
  });

  console.log(`\n✅ Migration complete! Updated ${migratedCount} files`);
  console.log('💾 Backups created with .shim-backup extension');
  console.log('💡 Run with --revert to undo changes');
}

function revertCommand() {
  console.log('↩️  Reverting migration...\n');

  const allFiles = [];
  DIRECTORIES_TO_SCAN.forEach((dir) => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });

  let revertedCount = 0;

  allFiles.forEach((filePath) => {
    const reverted = revertFile(filePath);
    if (reverted) {
      console.log(`↩️  Reverted: ${filePath}`);
      revertedCount++;
    }
  });

  console.log(`\n✅ Reverted ${revertedCount} files`);
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

console.log('================================================');
console.log('🔄 Shim Migration Helper');
console.log('================================================\n');

switch (command) {
  case '--check':
    checkCommand();
    break;
  case '--migrate':
    console.log('⚠️  WARNING: This will modify your files!');
    console.log('⚠️  Make sure you have committed your changes or have a backup.\n');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    setTimeout(() => {
      migrateCommand();
    }, 3000);
    break;
  case '--revert':
    revertCommand();
    break;
  default:
    console.log('Usage:');
    console.log('  node shim-migration-helper.js --check     Check files that need migration');
    console.log('  node shim-migration-helper.js --migrate   Perform migration (creates backups)');
    console.log('  node shim-migration-helper.js --revert    Revert to shim imports (from backups)');
    process.exit(1);
}
