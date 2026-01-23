#!/bin/bash

# 🧪 Test Next.js Migration Script
# Validates that migration was successful

echo "🧪 Testing Next.js Migration..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

# ============================================================================
# Step 1: Check if dev server is running
# ============================================================================

echo -e "${BLUE}🔍 Step 1: Checking dev server...${NC}"

if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Dev server not running${NC}"
    echo "Please start with: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# ============================================================================
# Step 2: Test configuration
# ============================================================================

echo -e "${BLUE}🔍 Step 2: Checking configuration...${NC}"

# Check shim config
if grep -q "USE_NEXTJS_MODE = true" components/shim/config.ts; then
    echo -e "${GREEN}✅ Config set to Next.js mode${NC}"
else
    echo -e "${RED}❌ Config still in React Router mode${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if React Router entry point removed
if [ ! -f "App.tsx" ] || [ -f "App.reactrouter.tsx.backup" ]; then
    echo -e "${GREEN}✅ React Router entry point removed${NC}"
else
    echo -e "${YELLOW}⚠️  App.tsx still exists (may need cleanup)${NC}"
fi

echo ""

# ============================================================================
# Step 3: Test critical pages
# ============================================================================

echo -e "${BLUE}🔍 Step 3: Testing critical pages...${NC}"

# List of critical pages
PAGES=(
    "/"
    "/admin"
    "/admin/dashboard"
    "/admin/tenants"
    "/admin/users"
    "/admin/platform/applications"
    "/admin/platform/roles"
    "/admin/platform/permissions"
)

for page in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    
    if [ "$STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ $page${NC} - OK (Status: $STATUS)"
    elif [ "$STATUS" -eq 307 ] || [ "$STATUS" -eq 308 ]; then
        echo -e "${YELLOW}⚠️  $page${NC} - Redirect (Status: $STATUS)"
    else
        echo -e "${RED}❌ $page${NC} - Failed (Status: $STATUS)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ============================================================================
# Step 4: Check for common issues
# ============================================================================

echo -e "${BLUE}🔍 Step 4: Checking for common issues...${NC}"

# Check for React Router imports
RR_IMPORTS=$(grep -r "from 'react-router" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$RR_IMPORTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $RR_IMPORTS React Router imports${NC}"
    echo "Run: grep -r \"from 'react-router\" ./app ./components --include=\"*.tsx\""
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No React Router imports found${NC}"
fi

# Check for Link with 'to'
LINK_TO=$(grep -r "<Link to=" ./app ./components --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$LINK_TO" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $LINK_TO Link components using 'to'${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ All Link components use 'href'${NC}"
fi

# Check for missing 'use client'
HOOKS_WITHOUT_CLIENT=$(find ./app -name "page.tsx" -o -name "layout.tsx" | xargs grep -l "useState\|useEffect\|useRouter" 2>/dev/null | while read file; do
    if ! head -n 3 "$file" | grep -q "'use client'"; then
        echo "$file"
    fi
done | wc -l)

if [ "$HOOKS_WITHOUT_CLIENT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $HOOKS_WITHOUT_CLIENT files using hooks without 'use client'${NC}"
else
    echo -e "${GREEN}✅ All hook-using files have 'use client'${NC}"
fi

echo ""

# ============================================================================
# Step 5: Test build
# ============================================================================

echo -e "${BLUE}🔍 Step 5: Testing build...${NC}"

# Try to build (this might take a while)
echo "Running: npm run build"
if npm run build > /tmp/nextjs-build.log 2>&1; then
    echo -e "${GREEN}✅ Build succeeded${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Check log: /tmp/nextjs-build.log"
    tail -n 20 /tmp/nextjs-build.log
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# Step 6: Summary
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All Tests Passed!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}🎉 Migration successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test navigation (click links, back/forward)"
    echo "2. Test forms (create, edit, delete)"
    echo "3. Check console for errors"
    echo "4. Monitor performance"
    echo ""
else
    echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    echo "Issues detected. Please review and fix."
    echo ""
    echo "Common fixes:"
    echo "1. Fix remaining React Router imports"
    echo "2. Fix Link components (to → href)"
    echo "3. Add 'use client' to components using hooks"
    echo ""
    echo "Or rollback:"
    echo -e "${YELLOW}./scripts/rollback-nextjs-migration.sh${NC}"
    echo ""
    exit 1
fi
