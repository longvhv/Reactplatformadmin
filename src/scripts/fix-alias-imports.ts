/**
 * Script to fix @/ alias imports to relative paths
 * This is required for Figma Make environment which doesn't support TS path aliases
 * 
 * Run with: deno run --allow-read --allow-write scripts/fix-alias-imports.ts
 */

import * as path from "https://deno.land/std@0.208.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface ImportReplacement {
  from: RegExp;
  getTo: (depth: number) => string;
}

const replacements: ImportReplacement[] = [
  {
    from: /from\s+['"]@\/components\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}components/`
  },
  {
    from: /from\s+['"]@\/hooks\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}hooks/`
  },
  {
    from: /from\s+['"]@\/providers\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}providers/`
  },
  {
    from: /from\s+['"]@\/lib\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}lib/`
  },
  {
    from: /from\s+['"]@\/utils\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}utils/`
  },
  {
    from: /from\s+['"]@\/data\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}data/`
  },
  {
    from: /from\s+['"]@\/api\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}api/`
  },
  {
    from: /from\s+['"]@\/types\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}types/`
  },
  {
    from: /from\s+['"]@\/constants\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}constants/`
  },
  {
    from: /from\s+['"]@\/services\//g,
    getTo: (depth) => `from '${getRelativePath(depth)}services/`
  },
];

function getRelativePath(depth: number): string {
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

function calculateDepth(filePath: string): number {
  const segments = filePath.split(path.SEP).filter(s => s.length > 0);
  return segments.length - 1; // Subtract 1 because we don't count the file itself
}

async function fixImportsInFile(filePath: string): Promise<boolean> {
  try {
    let content = await Deno.readTextFile(filePath);
    const originalContent = content;
    
    // Calculate how many levels deep this file is
    const relativePath = path.relative(Deno.cwd(), filePath);
    const depth = calculateDepth(relativePath);
    
    // Apply all replacements
    let hasChanges = false;
    for (const replacement of replacements) {
      const matches = content.match(replacement.from);
      if (matches) {
        content = content.replace(replacement.from, replacement.getTo(depth));
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await Deno.writeTextFile(filePath, content);
      console.log(`✅ Fixed: ${relativePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting to fix @/ alias imports...\n');
  
  let filesProcessed = 0;
  let filesFixed = 0;
  
  // Process all TypeScript/TSX files in app directory
  for await (const entry of walk("./app", {
    exts: [".ts", ".tsx"],
    skip: [/node_modules/, /\.next/],
  })) {
    if (entry.isFile) {
      filesProcessed++;
      const fixed = await fixImportsInFile(entry.path);
      if (fixed) {
        filesFixed++;
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files fixed: ${filesFixed}`);
  console.log(`   Files unchanged: ${filesProcessed - filesFixed}`);
  console.log('\n✨ Done!');
}

if (import.meta.main) {
  main();
}
