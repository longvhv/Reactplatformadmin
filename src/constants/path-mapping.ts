/**
 * Path Mapping - Standardized English Logic
 * 
 * Maps legacy paths to new English paths
 * for backward compatibility and consistent routing
 * 
 * 🌐 PATH STRUCTURE:
 * - Main: /admin/*
 * - Commerce: /commerce/*
 * - Platform: /platform/*
 * - Integrations: /integrations/*
 * - Telemetry: /monitoring/* (or /admin/registration-analytics etc)
 * - System: /system/*
 */

/**
 * Legacy/Vietnamese to English path mapping
 */
export const PATH_MAPPING: Record<string, string> = {
  // ============================================
  // MAIN
  // ============================================
  '/core/dashboard': '/admin/dashboard',
  '/quan-tri/trang-chu': '/admin/dashboard',
  
  // ============================================
  // IDENTITY & ACCESS (QUẢN TRỊ)
  // ============================================
  '/core/tenants': '/admin/tenants',
  '/quan-tri/to-chuc': '/admin/tenants',
  
  '/core/users': '/admin/users',
  '/quan-tri/nguoi-dung': '/admin/users',
  
  '/core/user-delegations': '/admin/user-delegations',
  '/quan-tri/uy-quyen-nguoi-dung': '/admin/user-delegations',
  
  '/core/roles': '/admin/roles',
  '/quan-tri/vai-tro': '/admin/roles',
  
  '/core/permissions': '/admin/permissions',
  '/quan-tri/quyen-han': '/admin/permissions',
  
  '/core/auth-logs': '/admin/auth-logs',
  '/quan-tri/nhat-ky-xac-thuc': '/admin/auth-logs',
  
  '/core/audit-logs': '/admin/audit-logs',
  '/quan-tri/nhat-ky-kiem-toan': '/admin/audit-logs',
  
  '/core/user-roles': '/admin/user-roles',
  '/quan-tri/vai-tro-nguoi-dung': '/admin/user-roles',
  
  '/core/tenant-members': '/admin/tenant-members',
  '/quan-tri/thanh-vien-to-chuc': '/admin/tenant-members',
  
  // ============================================
  // COMMERCE & PAYMENTS (THƯƠNG MẠI)
  // ============================================
  '/core/products': '/commerce/products',
  '/thuong-mai/san-pham': '/commerce/products',
  
  '/core/saas-product-types': '/commerce/saas-product-types',
  '/thuong-mai/loai-san-pham-saas': '/commerce/saas-product-types',
  
  '/core/service-packages': '/commerce/service-packages',
  '/thuong-mai/goi-dich-vu': '/commerce/service-packages',
  
  '/core/subscription-orders': '/commerce/subscription-orders',
  '/thuong-mai/don-dang-ky': '/commerce/subscription-orders',
  
  '/core/subscription-invoices': '/commerce/subscription-invoices',
  '/thuong-mai/hoa-don-dang-ky': '/commerce/subscription-invoices',
  
  '/core/tenant-subscriptions': '/commerce/tenant-subscriptions',
  '/thuong-mai/dang-ky-to-chuc': '/commerce/tenant-subscriptions',
  
  '/core/digital-assets': '/commerce/digital-assets',
  '/thuong-mai/tai-san-so': '/commerce/digital-assets',
  
  '/core/service-deliveries': '/commerce/service-deliveries',
  '/thuong-mai/giao-dich-vu': '/commerce/service-deliveries',
  
  '/core/product-types': '/commerce/product-types',
  '/thuong-mai/loai-san-pham': '/commerce/product-types',
  
  // ============================================
  // PLATFORM & CONFIGURATION (NỀN TẢNG)
  // ============================================
  '/core/applications': '/platform/applications',
  '/nen-tang/ung-dung': '/platform/applications',
  
  '/core/system-categories': '/platform/system-categories',
  '/nen-tang/danh-muc-he-thong': '/platform/system-categories',
  
  '/core/location-types': '/platform/location-types',
  '/nen-tang/loai-vi-tri': '/platform/location-types',
  
  '/core/locations': '/platform/locations',
  '/nen-tang/vi-tri': '/platform/locations',
  
  '/core/rate-limits': '/platform/rate-limits',
  '/nen-tang/gioi-han-tan-suat': '/platform/rate-limits',
  
  '/core/reserved-slugs': '/platform/reserved-slugs',
  '/nen-tang/duong-dan-bao-luu': '/platform/reserved-slugs',
  '/nen-tang/slug-da-dat-truoc': '/platform/reserved-slugs',
  
  '/core/system-announcements': '/platform/system-announcements',
  '/nen-tang/thong-bao-he-thong': '/platform/system-announcements',
  
  '/core/system-jobs': '/platform/system-jobs',
  '/nen-tang/tac-vu-he-thong': '/platform/system-jobs',
  
  '/core/feature-flags': '/platform/feature-flags',
  '/nen-tang/co-tinh-nang': '/platform/feature-flags',
  
  '/core/notification-templates': '/platform/notification-templates',
  '/nen-tang/mau-thong-bao': '/platform/notification-templates',
  
  '/core/legal-documents': '/platform/legal-documents',
  '/nen-tang/tai-lieu-phap-ly': '/platform/legal-documents',
  
  // ============================================
  // INTEGRATIONS & API (TÍCH HỢP)
  // ============================================
  '/core/webhooks': '/integrations/webhooks',
  '/tich-hop/webhook': '/integrations/webhooks',
  
  '/core/api-usage-logs': '/integrations/api-usage-logs',
  '/tich-hop/nhat-ky-api': '/integrations/api-usage-logs',
  
  // ============================================
  // TELEMETRY & REPORTS (GIÁM SÁT)
  // ============================================
  '/core/user-registration-telemetry': '/admin/registration-analytics',
  '/giam-sat/dang-ky-nguoi-dung': '/admin/registration-analytics',
  '/quan-tri/phan-tich-dang-ky': '/admin/registration-analytics', // Also mapped here just in case
  
  '/core/traffic-logs': '/platform/traffic-logs',
  '/giam-sat/nhat-ky-luu-luong': '/platform/traffic-logs',
  '/nen-tang/nhat-ky-truy-cap': '/platform/traffic-logs',
  
  // ============================================
  // SYSTEM & SUPPORT (HỆ THỐNG)
  // ============================================
  '/core/settings': '/system/settings',
  '/he-thong/cai-dat': '/system/settings',
  
  '/core/help': '/system/help',
  '/he-thong/tro-giup': '/system/help',
  
  '/core/dev-docs': '/system/dev-docs',
  '/he-thong/tai-lieu-phat-trien': '/system/dev-docs',
};

/**
 * Reverse mapping (English -> Core/Vietnamese)
 * NOTE: This might not be unique if multiple keys map to same value.
 * But we primarily use PATH_MAPPING to normalize to English.
 */
export const REVERSE_PATH_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(PATH_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Normalize path to English standard
 */
export function normalizePath(path: string): string {
  return PATH_MAPPING[path] || path;
}

/**
 * @deprecated Use normalizePath instead. This is kept for backward compatibility.
 */
export function toLegacyPath(path: string): string {
  // Attempt to find if the input is a new English path, return it (or a legacy one if needed?)
  // Given the refactor, we prefer English.
  return normalizePath(path);
}

/**
 * @deprecated Use normalizePath instead. This was "toVietnamesePath" but now maps to English.
 */
export function toVietnamesePath(legacyPath: string): string {
  return normalizePath(legacyPath);
}

/**
 * Get all available paths
 */
export function getAllPaths(): string[] {
  return Object.values(PATH_MAPPING);
}

/**
 * Get all legacy/Vietnamese keys
 */
export function getAllLegacyPaths(): string[] {
  return Object.keys(PATH_MAPPING);
}
