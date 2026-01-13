#!/bin/bash

# ============================================
# Import Documentation from GitHub Repository
# ============================================
# This script downloads Database.md and Collections.md
# from the Reactplatformadmin GitHub repository
# ============================================

set -e  # Exit on error

REPO_URL="https://raw.githubusercontent.com/longvhv/Reactplatformadmin/main/src/docs"
DOCS_DIR="./docs"

echo "================================"
echo "📥 Importing Documentation Files"
echo "================================"
echo ""

# Create docs directory if it doesn't exist
mkdir -p "$DOCS_DIR"

# Download Database.md
echo "⏬ Downloading Database.md (1.4 MB)..."
if curl -f -o "$DOCS_DIR/Database.md" "$REPO_URL/Database.md"; then
  SIZE=$(du -h "$DOCS_DIR/Database.md" | cut -f1)
  echo "✅ Database.md downloaded successfully ($SIZE)"
else
  echo "❌ Failed to download Database.md"
  exit 1
fi

echo ""

# Download Collections.md
echo "⏬ Downloading Collections.md (129 KB)..."
if curl -f -o "$DOCS_DIR/Collections.md" "$REPO_URL/Collections.md"; then
  SIZE=$(du -h "$DOCS_DIR/Collections.md" | cut -f1)
  echo "✅ Collections.md downloaded successfully ($SIZE)"
else
  echo "❌ Failed to download Collections.md"
  exit 1
fi

echo ""
echo "================================"
echo "✨ Import Complete!"
echo "================================"
echo ""
echo "📁 Files saved to:"
echo "   - $DOCS_DIR/Database.md"
echo "   - $DOCS_DIR/Collections.md"
echo ""
echo "You can now read these files with:"
echo "   cat $DOCS_DIR/Database.md | less"
echo "   cat $DOCS_DIR/Collections.md | less"
echo ""
