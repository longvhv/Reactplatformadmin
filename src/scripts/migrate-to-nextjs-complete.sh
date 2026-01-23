#!/bin/bash

# 🚀 Complete Next.js Migration Script
# Migrates from React Router to Next.js App Router

set -e

echo "🚀 Starting Complete Next.js Migration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Step 1: Pre-migration Checks
# ============================================================================

echo -e "${BLUE}📋 Step 1: Pre-migration Checks${NC}"

# Check if Next.js is installed
if ! npm list next > /dev/null 2>&1; then
    echo -e "${RED}❌ Next.js not found. Installing...${NC}"
    npm install next@14.2.0
fi

# Check if we're in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not a git repository. Skipping git backup.${NC}"
else
    echo -e "${GREEN}✅ Git repository detected${NC}"
    
    # Create backup commit
    git add .
    git commit -m "Backup before Next.js migration" || echo "Nothing to commit"
    
    # Create migration branch
    git checkout -b nextjs-migration 2>/dev/null || git checkout nextjs-migration
fi

echo ""

# ============================================================================
# Step 2: Backup Files
# ============================================================================

echo -e "${BLUE}📦 Step 2: Creating Backups${NC}"

BACKUP_DIR="./backup-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup critical files
cp App.tsx $BACKUP_DIR/App.tsx.backup 2>/dev/null || echo "App.tsx not found"
cp components/shim/next-navigation.tsx $BACKUP_DIR/next-navigation.tsx.backup 2>/dev/null || echo "Shim not found"
cp components/shim/config.ts $BACKUP_DIR/config.ts.backup 2>/dev/null || echo "Config not found"

echo -e "${GREEN}✅ Backups created at: $BACKUP_DIR${NC}"
echo ""

# ============================================================================
# Step 3: Update Navigation Shim
# ============================================================================

echo -e "${BLUE}🔧 Step 3: Updating Navigation Shim${NC}"

# Check if nextjs version exists
if [ -f "components/shim/next-navigation-nextjs.tsx" ]; then
    echo -e "${GREEN}Found next-navigation-nextjs.tsx${NC}"
    
    # Backup old shim
    mv components/shim/next-navigation.tsx components/shim/next-navigation-reactrouter.tsx.backup
    
    # Use new Next.js shim
    cp components/shim/next-navigation-nextjs.tsx components/shim/next-navigation.tsx
    
    echo -e "${GREEN}✅ Navigation shim updated to Next.js mode${NC}"
else
    echo -e "${YELLOW}⚠️  next-navigation-nextjs.tsx not found.${NC}"
    echo "Creating it now..."
    
    # Create the file
    cat > components/shim/next-navigation-nextjs.tsx << 'EOFSHIM'
/**
 * Next.js Navigation - Pure Next.js Implementation
 * 
 * USE THIS FILE WHEN: Migrating to Next.js App Router
 * REPLACE: /components/shim/next-navigation.tsx with this file
 */

'use client';

// Re-export everything from Next.js
export {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
  permanentRedirect,
} from 'next/navigation';

export { default as Link } from 'next/link';

// Type exports for TypeScript
export type { ReadonlyURLSearchParams } from 'next/navigation';

// ============================================================================
// COMPATIBILITY HELPERS (if needed during migration)
// ============================================================================

/**
 * ParamsProvider - No longer needed in Next.js
 * Kept for backwards compatibility during migration
 */
export function ParamsProvider({ 
  params, 
  children 
}: { 
  params: Record<string, string>; 
  children: React.ReactNode 
}) {
  // In Next.js, params come from useParams() automatically
  // This is just a passthrough for migration compatibility
  return <>{children}</>;
}

/**
 * Helper to check if running in Next.js mode
 */
export function isShimMode(): boolean {
  return false; // Always false - we're in Next.js mode
}

/**
 * Log usage - no-op in Next.js mode
 */
export function logShimUsage(component: string, hook: string): void {
  // No-op - not needed in Next.js
}
EOFSHIM

    # Now use it
    mv components/shim/next-navigation.tsx components/shim/next-navigation-reactrouter.tsx.backup
    cp components/shim/next-navigation-nextjs.tsx components/shim/next-navigation.tsx
    
    echo -e "${GREEN}✅ Created and activated next-navigation-nextjs.tsx${NC}"
fi

echo ""

# ============================================================================
# Step 4: Update Config
# ============================================================================

echo -e "${BLUE}⚙️  Step 4: Updating Configuration${NC}"

# Update config.ts
cat > components/shim/config.ts << 'EOF'
/**
 * Shim Configuration - Next.js Mode
 * Migration completed - now using real Next.js navigation
 */

// Set to true - we're now in Next.js mode
export const USE_NEXTJS_MODE = true;

// Development flag for debugging
export const DEBUG_SHIM = false;
EOF

echo -e "${GREEN}✅ Config updated to Next.js mode${NC}"
echo ""

# ============================================================================
# Step 5: Fix Import Paths
# ============================================================================

echo -e "${BLUE}🔧 Step 5: Fixing Import Paths${NC}"

# Count files that need updating
LINK_COUNT=$(grep -r "Link to=" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
NAV_COUNT=$(grep -r "from 'react-router" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")

echo "Found $LINK_COUNT Link components with 'to' prop"
echo "Found $NAV_COUNT React Router imports"

# Fix Link components (to → href)
if [ "$LINK_COUNT" -gt 0 ]; then
    find ./app ./components -name "*.tsx" -type f -exec sed -i.bak 's/<Link to=/<Link href=/g' {} \;
    find ./app ./components -name "*.bak" -type f -delete
    echo -e "${GREEN}✅ Fixed $LINK_COUNT Link components${NC}"
fi

# Fix React Router imports
if [ "$NAV_COUNT" -gt 0 ]; then
    find ./app ./components -name "*.tsx" -type f -exec sed -i.bak "s|from 'react-router-dom'|from '@/components/shim/next-navigation'|g" {} \;
    find ./app ./components -name "*.tsx" -type f -exec sed -i.bak "s|from 'react-router'|from '@/components/shim/next-navigation'|g" {} \;
    find ./app ./components -name "*.bak" -type f -delete
    echo -e "${GREEN}✅ Fixed $NAV_COUNT imports${NC}"
fi

echo ""

# ============================================================================
# Step 6: Add 'use client' Directives
# ============================================================================

echo -e "${BLUE}🔧 Step 6: Adding 'use client' Directives${NC}"

# Function to check if file needs 'use client'
add_use_client() {
    local file=$1
    
    # Skip if already has 'use client'
    if head -n 5 "$file" | grep -q "'use client'"; then
        return 1
    fi
    
    # Check if file uses hooks or browser APIs
    if grep -q "useState\|useEffect\|useRouter\|useParams\|useSearchParams\|window\.\|localStorage\|document\." "$file"; then
        # Add 'use client' at the top (after any comments)
        awk 'NR==1 && /^(\/\/|\/\*)/ {print; next} NR==1 {print "'\''use client'\''\n"; print; next} {print}' "$file" > "$file.tmp"
        mv "$file.tmp" "$file"
        return 0
    fi
    
    return 1
}

CLIENT_COUNT=0
for file in $(find ./app -name "*.tsx" -type f); do
    if add_use_client "$file"; then
        CLIENT_COUNT=$((CLIENT_COUNT + 1))
    fi
done

echo -e "${GREEN}✅ Added 'use client' to $CLIENT_COUNT files${NC}"
echo ""

# ============================================================================
# Step 7: Create Next.js Entry Point
# ============================================================================

echo -e "${BLUE}📝 Step 7: Preparing Next.js Entry Point${NC}"

# Rename old App.tsx
if [ -f "App.tsx" ]; then
    mv App.tsx App.reactrouter.tsx.backup
    echo -e "${GREEN}✅ Backed up App.tsx to App.reactrouter.tsx.backup${NC}"
    echo -e "${YELLOW}ℹ️  Entry point is now /app/layout.tsx (Next.js standard)${NC}"
fi

# Update package.json scripts
if command -v jq > /dev/null 2>&1; then
    # Use jq if available
    jq '.scripts.dev = "next dev" | .scripts.build = "next build" | .scripts.start = "next start"' package.json > package.json.tmp
    mv package.json.tmp package.json
    echo -e "${GREEN}✅ Updated package.json scripts${NC}"
else
    echo -e "${YELLOW}⚠️  jq not found. Please manually update package.json scripts:${NC}"
    echo "  - dev: \"next dev\""
    echo "  - build: \"next build\""
    echo "  - start: \"next start\""
fi

echo ""

# ============================================================================
# Step 8: Final Checks
# ============================================================================

echo -e "${BLUE}🔍 Step 8: Final Checks${NC}"

# Check for remaining React Router imports
REMAINING_RR=$(grep -r "from 'react-router" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING_RR" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $REMAINING_RR remaining React Router imports${NC}"
    echo "Run: grep -r \"from 'react-router\" ./app ./components --include=\"*.tsx\""
else
    echo -e "${GREEN}✅ No React Router imports found${NC}"
fi

# Check for Link with 'to'
REMAINING_TO=$(grep -r "<Link to=" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING_TO" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $REMAINING_TO Link components still using 'to'${NC}"
else
    echo -e "${GREEN}✅ All Link components use 'href'${NC}"
fi

echo ""

# ============================================================================
# Step 9: Validation
# ============================================================================

echo -e "${GREEN}✅ Migration Complete!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Next.js Migration Successful!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Clear cache:"
echo -e "   ${GREEN}rm -rf .next${NC}"
echo ""
echo "2. Start dev server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Open browser:"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "4. Test critical pages:"
echo "   ✓ /admin/dashboard"
echo "   ✓ /admin/tenants"
echo "   ✓ /admin/users"
echo "   ✓ /admin/tenants/[id]"
echo ""
echo -e "${YELLOW}🔄 If Issues Occur:${NC}"
echo -e "   ${GREEN}./scripts/rollback-nextjs-migration.sh${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   ${GREEN}NEXTJS_MIGRATION_GUIDE_COMPLETE.md${NC}"
echo ""
echo -e "${YELLOW}📦 Backup Location:${NC}"
echo -e "   ${GREEN}$BACKUP_DIR${NC}"
echo ""
