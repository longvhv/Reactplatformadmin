# Quick Script to Update All Module Paths

Use find-and-replace in your editor for each module:

## Auth Logs
File: `/modules/auth-logs/index.tsx`
- Find: `path: "/core/auth-logs"`
- Replace: `path: "/quan-tri/nhat-ky-xac-thuc"`

## Audit Logs  
File: `/modules/audit-logs/index.tsx`
- Find: `path: "/core/audit-logs"`
- Replace: `path: "/quan-tri/nhat-ky-kiem-toan"`

## Applications (DONE)

## Settings
File: `/modules/settings/index.tsx`
- Find: `path: "/core/settings"`
- Replace: `path: "/he-thong/cai-dat"`

## Help
File: `/modules/help/index.tsx`
- Find: `path: "/core/help"`
- Replace: `path: "/he-thong/tro-giup"`

## Dev Docs
File: `/modules/dev-docs/index.tsx`
- Find: `path: "/core/dev-docs"`
- Replace: `path: "/he-thong/tai-lieu-phat-trien"`
- Find: `path: "/core/api-docs"`  
- Replace: `path: "/he-thong/tai-lieu-phat-trien/api"`
- Find: `path: "/core/database-docs"`
- Replace: `path: "/he-thong/tai-lieu-phat-trien/database"`

## System Categories
File: `/modules/system-category/index.tsx`
- Find: `"/core/system-categories"`
- Replace: `"/nen-tang/danh-muc-he-thong"`
- Find: `"/core/regions"`
- Replace: `"/nen-tang/khu-vuc"`

## Service Packages
File: `/modules/service-packages/index.tsx`
- Find: `"/core/service-packages"`
- Replace: `"/thuong-mai/goi-dich-vu"`

## Subscription Orders
File: `/modules/subscription-orders/index.tsx`
- Find: `"/core/subscription-orders"`
- Replace: `"/thuong-mai/don-dang-ky"`

## Subscription Invoices
File: `/modules/subscription-invoices/index.tsx`
- Find: `"/core/subscription-invoices"`
- Replace: `"/thuong-mai/hoa-don-dang-ky"`

## Webhooks
File: `/modules/webhooks/index.tsx`
- Find: `"/core/webhooks"`
- Replace: `"/tich-hop/webhook"`

## All other modules - use path-mapping.ts for reference
