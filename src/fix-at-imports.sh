#!/bin/bash

# Script to replace @/ imports with relative paths in all page files
# This fixes the lazy loading issue in Figma Make environment

echo "🔧 Fixing @/ imports to relative paths..."

# Function to calculate relative path based on file depth
get_relative_prefix() {
  local file=$1
  local depth=$(echo "$file" | tr -cd '/' | wc -c)
  local prefix=""
  
  # Calculate how many ../ we need based on depth from root
  # /app/(admin)/admin/tenants/page.tsx = depth 4, need ../../../../
  for ((i=0; i<depth; i++)); do
    prefix="../$prefix"
  done
  
  echo "$prefix"
}

# Find all .tsx files in app/(admin)/ directory
find ./app -name "*.tsx" -type f | while read -r file; do
  echo "Processing: $file"
  
  # Get the relative prefix for this file
  prefix=$(get_relative_prefix "$file")
  
  # Replace @/ imports with relative paths using sed
  # macOS compatible sed with backup
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' \
      -e "s|from '@/components/|from '${prefix}components/|g" \
      -e "s|from '@/hooks/|from '${prefix}hooks/|g" \
      -e "s|from '@/providers/|from '${prefix}providers/|g" \
      -e "s|from '@/lib/|from '${prefix}lib/|g" \
      -e "s|from '@/utils/|from '${prefix}utils/|g" \
      -e "s|from '@/data/|from '${prefix}data/|g" \
      -e "s|from '@/api/|from '${prefix}api/|g" \
      -e "s|from '@/types/|from '${prefix}types/|g" \
      -e "s|from '@/constants/|from '${prefix}constants/|g" \
      -e "s|from '@/services/|from '${prefix}services/|g" \
      -e "s|from \"@/components/|from \"${prefix}components/|g" \
      -e "s|from \"@/hooks/|from \"${prefix}hooks/|g" \
      -e "s|from \"@/providers/|from \"${prefix}providers/|g" \
      -e "s|from \"@/lib/|from \"${prefix}lib/|g" \
      -e "s|from \"@/utils/|from \"${prefix}utils/|g" \
      -e "s|from \"@/data/|from \"${prefix}data/|g" \
      -e "s|from \"@/api/|from \"${prefix}api/|g" \
      -e "s|from \"@/types/|from \"${prefix}types/|g" \
      -e "s|from \"@/constants/|from \"${prefix}constants/|g" \
      -e "s|from \"@/services/|from \"${prefix}services/|g" \
      "$file"
  else
    # Linux sed
    sed -i \
      -e "s|from '@/components/|from '${prefix}components/|g" \
      -e "s|from '@/hooks/|from '${prefix}hooks/|g" \
      -e "s|from '@/providers/|from '${prefix}providers/|g" \
      -e "s|from '@/lib/|from '${prefix}lib/|g" \
      -e "s|from '@/utils/|from '${prefix}utils/|g" \
      -e "s|from '@/data/|from '${prefix}data/|g" \
      -e "s|from '@/api/|from '${prefix}api/|g" \
      -e "s|from '@/types/|from '${prefix}types/|g" \
      -e "s|from '@/constants/|from '${prefix}constants/|g" \
      -e "s|from '@/services/|from '${prefix}services/|g" \
      -e "s|from \"@/components/|from \"${prefix}components/|g" \
      -e "s|from \"@/hooks/|from \"${prefix}hooks/|g" \
      -e "s|from \"@/providers/|from \"${prefix}providers/|g" \
      -e "s|from \"@/lib/|from \"${prefix}lib/|g" \
      -e "s|from \"@/utils/|from \"${prefix}utils/|g" \
      -e "s|from \"@/data/|from \"${prefix}data/|g" \
      -e "s|from \"@/api/|from \"${prefix}api/|g" \
      -e "s|from \"@/types/|from \"${prefix}types/|g" \
      -e "s|from \"@/constants/|from \"${prefix}constants/|g" \
      -e "s|from \"@/services/|from \"${prefix}services/|g" \
      "$file"
  fi
done

echo "✅ Done! All @/ imports have been replaced with relative paths."
echo "🔍 Please test the application to ensure everything works correctly."
