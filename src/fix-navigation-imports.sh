#!/bin/bash

# Script to fix next/navigation imports to use shim

FILES=(
  "/app/(admin)/platform/feature-flags/[id]/page.tsx"
  "/app/(admin)/platform/feature-flags/edit/[id]/page.tsx"
  "/app/(admin)/platform/user-delegations/create/page.tsx"
  "/app/(admin)/platform/user-delegations/edit/[id]/page.tsx"
  "/app/(admin)/platform/system-announcements/page.tsx"
  "/app/(admin)/platform/notification-templates/page.tsx"
  "/app/(admin)/platform/roles/create/page.tsx"
  "/app/(admin)/platform/roles/edit/[id]/page.tsx"
  "/app/(admin)/platform/tenant-rate-limits/page.tsx"
  "/app/(admin)/platform/tenant-rate-limits/create/page.tsx"
  "/app/(admin)/platform/tenant-rate-limits/edit/[id]/page.tsx"
  "/app/(admin)/platform/users/create/page.tsx"
  "/app/(admin)/platform/users/edit/[id]/page.tsx"
  "/app/(admin)/platform/user-consents/page.tsx"
  "/app/(admin)/platform/user-consents/create/page.tsx"
  "/app/(admin)/platform/user-consents/edit/[id]/page.tsx"
  "/app/(admin)/platform/user-sessions/page.tsx"
  "/app/(admin)/platform/user-sessions/create/page.tsx"
  "/app/(admin)/platform/user-sessions/edit/[id]/page.tsx"
  "/app/(admin)/platform/user-roles/page.tsx"
  "/app/(admin)/platform/user-roles/create/page.tsx"
  "/app/(admin)/platform/user-roles/edit/[id]/page.tsx"
  "/app/(admin)/platform/user-devices/page.tsx"
  "/app/(admin)/platform/user-devices/create/page.tsx"
  "/app/(admin)/platform/user-devices/edit/[id]/page.tsx"
  "/app/(admin)/platform/legal-documents/page.tsx"
  "/app/(admin)/platform/legal-documents/[id]/page.tsx"
  "/app/(admin)/subscriptions/invoices/[id]/page.tsx"
)

echo "Fixing navigation imports in ${#FILES[@]} files..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Replace single import
    sed -i "s|from 'next/navigation'|from '@/components/shim/next-navigation'|g" "$file"
    echo "✓ Fixed: $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo "Done! Fixed all navigation imports."
