#!/bin/bash
# Auto-update all module paths to Vietnamese

# This script updates all module paths from /core/* to Vietnamese paths
# Run from project root: bash scripts/batch-update-paths.sh

echo "🚀 Starting batch path update..."

# Function to update file
update_module() {
  local file=$1
  local old_path=$2
  local new_path=$3
  
  if [ -f "$file" ]; then
    sed -i "s|$old_path|$new_path|g" "$file"
    echo "✅ Updated: $file"
  fi
}

# Subscription Orders
update_module "modules/subscription-orders/index.tsx" '"/core/subscription-orders"' '"/thuong-mai/don-dang-ky"'

# Subscription Invoices  
update_module "modules/subscription-invoices/index.tsx" '"/core/subscription-invoices"' '"/thuong-mai/hoa-don-dang-ky"'

# Tenant Subscriptions
update_module "modules/tenant-subscriptions/index.tsx" '"/core/tenant-subscriptions"' '"/thuong-mai/dang-ky-to-chuc"'

# Digital Assets
update_module "modules/digital-assets/index.tsx" '"/core/digital-assets"' '"/thuong-mai/tai-san-so"'

# Service Deliveries
update_module "modules/service-deliveries/index.tsx" '"/core/service-deliveries"' '"/thuong-mai/giao-dich-vu"'

# Product Types
update_module "modules/product-types/index.tsx" '"/core/product-types"' '"/thuong-mai/loai-san-pham"'

# SaaS Product Types
update_module "modules/saas-product-types/index.tsx" '"/core/saas-product-types"' '"/thuong-mai/loai-san-pham-saas"'

# System Categories
update_module "modules/system-category/index.tsx" '"/core/system-categories"' '"/nen-tang/danh-muc-he-thong"'
update_module "modules/system-category/index.tsx" '"/core/regions"' '"/nen-tang/khu-vuc"'

# Location Types
update_module "modules/location-types/index.tsx" '"/core/location-types"' '"/nen-tang/loai-vi-tri"'

# Locations
update_module "modules/locations/index.tsx" '"/core/locations"' '"/nen-tang/vi-tri"'

# Rate Limits
update_module "modules/rate-limits/index.tsx" '"/core/rate-limits"' '"/nen-tang/gioi-han-tan-suat"'

# Reserved Slugs
update_module "modules/reserved-slugs/module.tsx" '"/core/reserved-slugs"' '"/nen-tang/duong-dan-bao-luu"'

# System Announcements
update_module "modules/system-announcements/index.tsx" '"/core/system-announcements"' '"/nen-tang/thong-bao-he-thong"'

# System Jobs
update_module "modules/system-jobs/index.tsx" '"/core/system-jobs"' '"/nen-tang/tac-vu-he-thong"'

# Feature Flags
update_module "modules/feature-flags/index.tsx" '"/core/feature-flags"' '"/nen-tang/co-tinh-nang"'

# Notification Templates
update_module "modules/notification-templates/index.tsx" '"/core/notification-templates"' '"/nen-tang/mau-thong-bao"'

# Legal Documents
update_module "modules/legal-documents/index.tsx" '"/core/legal-documents"' '"/nen-tang/tai-lieu-phap-ly"'

# API Usage Logs
update_module "modules/api-usage-logs/index.tsx" '"/core/api-usage-logs"' '"/tich-hop/nhat-ky-api"'

# Traffic Logs
update_module "modules/traffic-logs/index.tsx" '"/core/traffic-logs"' '"/giam-sat/nhat-ky-luu-luong"'

# User Registration Telemetry
update_module "modules/user-registration-telemetry/index.tsx" '"/core/user-registration-telemetry"' '"/giam-sat/dang-ky-nguoi-dung"'

# Tenant Members
update_module "modules/tenant-members/index.tsx" '"/core/tenant-members"' '"/quan-tri/thanh-vien-to-chuc"'

# User Roles
update_module "modules/user-roles/index.tsx" '"/core/user-roles"' '"/quan-tri/vai-tro-nguoi-dung"'

echo "✨ Batch update complete! Please restart dev server."
