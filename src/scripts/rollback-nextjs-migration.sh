#!/bin/bash

# 🔄 Rollback Next.js Migration Script
# Restores React Router configuration

set -e

echo "🔄 Rolling back Next.js migration..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Step 1: Find Backup
# ============================================================================

echo -e "${BLUE}🔍 Step 1: Looking for backups...${NC}"

# Find latest backup
BACKUP_DIR=$(ls -td backup-migration-* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}⚠️  No migration backup found.${NC}"
    echo "Attempting git rollback..."
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        git checkout App.tsx
        git checkout components/shim/
        echo -e "${GREEN}✅ Restored from git${NC}"
        exit 0
    else
        echo -e "${RED}❌ No backup and not a git repository${NC}"
        echo "Manual restore required."
        exit 1
    fi
fi

echo -e "${GREEN}✅ Found backup: $BACKUP_DIR${NC}"
echo ""

# ============================================================================
# Step 2: Restore Files
# ============================================================================

echo -e "${BLUE}📦 Step 2: Restoring files...${NC}"

# Restore App.tsx
if [ -f "$BACKUP_DIR/App.tsx.backup" ]; then
    cp "$BACKUP_DIR/App.tsx.backup" App.tsx
    echo -e "${GREEN}✅ Restored App.tsx${NC}"
fi

# Restore from App.reactrouter backup if exists
if [ -f "App.reactrouter.tsx.backup" ]; then
    mv App.reactrouter.tsx.backup App.tsx
    echo -e "${GREEN}✅ Restored React Router App.tsx${NC}"
fi

# Restore shim
if [ -f "$BACKUP_DIR/next-navigation.tsx.backup" ]; then
    cp "$BACKUP_DIR/next-navigation.tsx.backup" components/shim/next-navigation.tsx
    echo -e "${GREEN}✅ Restored navigation shim${NC}"
fi

# Restore from shim backup if exists
if [ -f "components/shim/next-navigation-reactrouter.tsx.backup" ]; then
    mv components/shim/next-navigation-reactrouter.tsx.backup components/shim/next-navigation.tsx
    echo -e "${GREEN}✅ Restored React Router shim${NC}"
fi

# Restore config
if [ -f "$BACKUP_DIR/config.ts.backup" ]; then
    cp "$BACKUP_DIR/config.ts.backup" components/shim/config.ts
    echo -e "${GREEN}✅ Restored config${NC}"
else
    # Manual restore config to React Router mode
    cat > components/shim/config.ts << 'EOF'
/**
 * Shim Configuration
 * Restored to React Router mode
 */

// Set to false for React Router shim mode
export const USE_NEXTJS_MODE = false;

// Development flag for debugging
export const DEBUG_SHIM = false;
EOF
    echo -e "${GREEN}✅ Reset config to React Router mode${NC}"
fi

echo ""

# ============================================================================
# Step 3: Revert Import Changes
# ============================================================================

echo -e "${BLUE}🔧 Step 3: Reverting import changes...${NC}"

# Revert Link href back to to (if needed)
HREF_COUNT=$(grep -r "<Link href=" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$HREF_COUNT" -gt 0 ]; then
    echo "Found $HREF_COUNT Link components with 'href' prop"
    find ./app ./components -name "*.tsx" -type f -exec sed -i.bak 's/<Link href=/<Link to=/g' {} \;
    find ./app ./components -name "*.bak" -type f -delete
    echo -e "${GREEN}✅ Reverted $HREF_COUNT Link components${NC}"
fi

echo ""

# ============================================================================
# Step 4: Update package.json
# ============================================================================

echo -e "${BLUE}📝 Step 4: Restoring package.json scripts...${NC}"

if command -v jq > /dev/null 2>&1; then
    # Restore original scripts
    jq '.scripts.dev = "vite" | .scripts.build = "tsc && vite build" | .scripts.start = "vite preview"' package.json > package.json.tmp
    mv package.json.tmp package.json
    echo -e "${GREEN}✅ Restored package.json scripts${NC}"
else
    echo -e "${YELLOW}⚠️  jq not found. Please manually restore package.json scripts:${NC}"
    echo "  - dev: \"vite\""
    echo "  - build: \"tsc && vite build\""
    echo "  - start: \"vite preview\""
fi

echo ""

# ============================================================================
# Step 5: Cleanup
# ============================================================================

echo -e "${BLUE}🧹 Step 5: Cleanup...${NC}"

# Remove Next.js specific files
rm -f components/shim/next-navigation-nextjs.tsx
echo -e "${GREEN}✅ Removed Next.js shim file${NC}"

# Clear Next.js cache
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✅ Cleared Next.js cache${NC}"
fi

echo ""

# ============================================================================
# Step 6: Git Operations
# ============================================================================

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${BLUE}📂 Step 6: Git operations...${NC}"
    
    # Delete migration branch if exists
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "nextjs-migration" ]; then
        git checkout main
        git branch -D nextjs-migration 2>/dev/null || true
        echo -e "${GREEN}✅ Deleted migration branch${NC}"
    fi
fi

echo ""

# ============================================================================
# Complete
# ============================================================================

echo -e "${GREEN}✅ Rollback Complete!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🔄 Successfully Rolled Back to React Router${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Verify configuration:"
echo -e "   ${GREEN}cat components/shim/config.ts${NC}"
echo -e "   Should show: ${GREEN}USE_NEXTJS_MODE = false${NC}"
echo ""
echo "2. Clear cache:"
echo -e "   ${GREEN}rm -rf node_modules/.cache${NC}"
echo ""
echo "3. Start dev server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "4. Verify in browser:"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}📦 Backup preserved at:${NC}"
echo -e "   ${GREEN}$BACKUP_DIR${NC}"
echo ""
