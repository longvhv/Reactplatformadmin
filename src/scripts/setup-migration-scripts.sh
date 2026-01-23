#!/bin/bash

# Setup migration scripts - make them executable

echo "🔧 Setting up migration scripts..."

chmod +x scripts/migrate-to-nextjs-complete.sh
chmod +x scripts/rollback-nextjs-migration.sh
chmod +x scripts/test-nextjs-migration.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Available commands:"
echo "  ./scripts/migrate-to-nextjs-complete.sh  - Run migration"
echo "  ./scripts/rollback-nextjs-migration.sh   - Rollback"
echo "  ./scripts/test-nextjs-migration.sh       - Test migration"
echo ""
echo "Start with: cat NEXTJS_MIGRATION_INDEX.md"
