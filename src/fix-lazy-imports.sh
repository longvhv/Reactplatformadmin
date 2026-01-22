#!/bin/bash

# Fix all lazy() imports to explicitly get default export
# This prevents "Element type is invalid. Received a promise" errors

echo "Fixing lazy() imports in all module files..."

# Find all index.tsx files in modules directory
find ./modules -name "index.tsx" -type f | while read file; do
  echo "Processing: $file"
  
  # Use sed to replace lazy(() => import(...)) with lazy(() => import(...).then(m => ({ default: m.default })))
  # This ensures we explicitly get the default export
  
  # macOS sed requires -i '' while Linux sed requires -i
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' -E 's/lazy\(\(\) => import\(([^)]+)\)\)/lazy(() => import(\1).then(m => ({ default: m.default })))/g' "$file"
  else
    # Linux
    sed -i -E 's/lazy\(\(\) => import\(([^)]+)\)\)/lazy(() => import(\1).then(m => ({ default: m.default })))/g' "$file"
  fi
done

echo "Done! All lazy imports have been fixed."
