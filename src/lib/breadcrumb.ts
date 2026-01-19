/**
 * Breadcrumb Utility
 * Generate breadcrumb from route path and module registry
 * 
 * 🌐 Supports Vietnamese path structure:
 * - /quan-tri/* (Main & Identity)
 * - /thuong-mai/* (Commerce)
 * - /nen-tang/* (Platform)
 * - /tich-hop/* (Integrations)
 * - /giam-sat/* (Telemetry)
 * - /he-thong/* (System)
 * 
 * ✅ Version 2.0 - Complete coverage for all modules
 */

import { ModuleRegistry } from '../core/ModuleRegistry';

export interface BreadcrumbItem {
  label: string;
  path: string;
  translationKey?: string;
}

/**
 * Generate breadcrumb items from current path
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const registry = ModuleRegistry.getInstance();
  const segments = pathname.split('/').filter(x => x);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    path: '/quan-tri/trang-chu',
    translationKey: 'navigation.dashboard',
  });

  // If we're on dashboard, return early
  if (segments.length === 0 || 
      (segments.length === 2 && segments[0] === 'quan-tri' && segments[1] === 'trang-chu')) {
    return breadcrumbs;
  }

  // ============================================
  // COMPLETE SEGMENT TRANSLATIONS (ALL MODULES)
  // ============================================
  const commonSegments: Record<string, string> = {
    // ========== CATEGORY PREFIXES ==========
    'quan-tri': 'menu.groups.identity',
    'thuong-mai': 'menu.groups.commerce',
    'commerce': 'menu.groups.commerce',
    'nen-tang': 'menu.groups.platform',
    'tich-hop': 'menu.groups.integrations',
    'giam-sat': 'menu.groups.telemetry',
    'he-thong': 'menu.groups.system',
    
    // ========== IDENTITY & ACCESS (QUẢN TRỊ) ==========
    'trang-chu': 'navigation.dashboard',
    'to-chuc': 'navigation.tenants',
    'nguoi-dung': 'navigation.users',
    'uy-quyen-nguoi-dung': 'navigation.userDelegations',
    'vai-tro': 'navigation.roles',
    'quyen-han': 'navigation.permissions',
    'nhat-ky-xac-thuc': 'navigation.authLogs',
    'nhat-ky-kiem-toan': 'navigation.auditLogs',
    'thanh-vien-to-chuc': 'navigation.tenantMembers',
    'vai-tro-nguoi-dung': 'navigation.userRoles',
    
    // ========== COMMERCE & PAYMENTS (ENGLISH) ==========
    'saas-product-types': 'navigation.saasProductTypes',
    'service-packages': 'navigation.servicePackages',
    'subscription-orders': 'navigation.subscriptionOrders',
    'subscription-invoices': 'navigation.subscriptionInvoices',
    'tenant-subscriptions': 'navigation.tenantSubscriptions',
    'digital-assets': 'navigation.digitalAssets',
    'service-deliveries': 'navigation.serviceDeliveries',
    'product-types': 'navigation.productTypes',

    // ========== COMMERCE & PAYMENTS (THƯƠNG MẠI) ==========
    'san-pham': 'navigation.products',
    'loai-san-pham': 'navigation.productTypes',
    'loai-san-pham-saas': 'navigation.saasProductTypes',
    'goi-dich-vu': 'navigation.servicePackages',
    'don-dang-ky': 'navigation.subscriptionOrders',
    'hoa-don-dang-ky': 'navigation.subscriptionInvoices',
    'dang-ky-to-chuc': 'navigation.tenantSubscriptions',
    'tai-san-so': 'navigation.digitalAssets',
    'giao-dich-vu': 'navigation.serviceDeliveries',
    
    // ========== PLATFORM & CONFIGURATION (NỀN TẢNG) ==========
    'ung-dung': 'navigation.applications',
    'danh-muc-he-thong': 'navigation.systemCategories',
    'loai-vi-tri': 'navigation.locationTypes',
    'vi-tri': 'navigation.locations',
    'gioi-han-tan-suat': 'navigation.rateLimits',
    'duong-dan-bao-luu': 'navigation.reservedSlugs',
    'thong-bao-he-thong': 'navigation.systemAnnouncements',
    'tac-vu-he-thong': 'navigation.systemJobs',
    'co-tinh-nang': 'navigation.featureFlags',
    'mau-thong-bao': 'navigation.notificationTemplates',
    'tai-lieu-phap-ly': 'navigation.legalDocuments',
    
    // ========== INTEGRATIONS & API (TÍCH HỢP) ==========
    'webhook': 'navigation.webhooks',
    'webhooks': 'navigation.webhooks',
    'nhat-ky-api': 'navigation.apiUsageLogs',
    
    // ========== TELEMETRY & REPORTS (GIÁM SÁT) ==========
    'dang-ky-nguoi-dung': 'navigation.userRegistrationTelemetry',
    'nhat-ky-luu-luong': 'navigation.trafficLogs',
    
    // ========== SYSTEM & SUPPORT (HỆ THỐNG) ==========
    'cai-dat': 'navigation.settings',
    'tro-giup': 'navigation.help',
    'tai-lieu-phat-trien': 'navigation.devDocs',
    
    // ========== SPECIAL PAGES ==========
    'phan-tich': 'navigation.analytics',
    'thong-ke': 'navigation.statistics',
    'bao-cao': 'navigation.reports',
    'tong-quan': 'navigation.overview',
    'hoat-dong': 'navigation.activity',
    'lich-su': 'navigation.history',
    'su-dung': 'navigation.usage',
    'quyen-han-he-thong': 'navigation.entitlements',
    'khoa': 'navigation.keys',
    'api': 'navigation.api',
    'tai-khoan-dich-vu': 'navigation.serviceAccounts',
    'mien': 'navigation.domains',
    'loi-moi': 'navigation.invitations',
    'dinh-tuyen': 'navigation.routes',
    'app-routes': 'navigation.appRoutes',
    'sso': 'navigation.sso',
    'cau-hinh': 'navigation.configurations',
    'cau-hinh-sso': 'navigation.ssoConfigs',
    'nhom-nguoi-dung': 'navigation.userGroups',
    'phien': 'navigation.sessions',
    'thiet-bi': 'navigation.devices',
    'dong-y': 'navigation.consents',
    'lien-ket': 'navigation.linkedIdentities',
    'xac-thuc-da-yeu-to': 'navigation.mfaMethods',
    'mfa': 'navigation.mfa',
    'phuong-thuc-xac-thuc': 'navigation.authMethods',
    'nhat-ky-giao-webhook': 'navigation.webhookDeliveryLogs',
    
    // ========== ACTIONS (VIETNAMESE) ==========
    'them': 'common.add',
    'sua': 'common.edit',
    'moi': 'common.new',
    'chi-tiet': 'common.detail',
    'xem': 'common.view',
    'xoa': 'common.delete',
    'sao-chep': 'common.duplicate',
    
    // ========== LEGACY ENGLISH PATHS (Backward Compatibility) ==========
    'core': 'navigation.dashboard',
    'dashboard': 'navigation.dashboard',
    'settings': 'navigation.settings',
    'profile': 'navigation.profile',
    'users': 'navigation.users',
    'roles': 'navigation.roles',
    'permissions': 'navigation.permissions',
    'tenants': 'navigation.tenants',
    'products': 'navigation.products',
    'analytics': 'navigation.analytics',
    'applications': 'navigation.applications',
    'webhooks': 'navigation.webhooks',
    'orders': 'navigation.subscriptionOrders',
    'invoices': 'navigation.subscriptionInvoices',
    'packages': 'navigation.servicePackages',
    'add': 'common.add',
    'edit': 'common.edit',
    'new': 'common.new',
    'detail': 'common.detail',
    'view': 'common.view',
  };

  // Build breadcrumbs from path segments
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip root category prefixes (they're just organizational, not clickable)
    if (i === 0 && ['quan-tri', 'thuong-mai', 'commerce', 'nen-tang', 'tich-hop', 'giam-sat', 'he-thong', 'core'].includes(segment)) {
      continue;
    }

    // Skip if segment is a UUID or ID
    if (isUUID(segment) || isNumericId(segment)) {
      // Get the context (previous non-action segment) to determine the type
      const contextSegment = findContextSegment(segments, i);
      breadcrumbs.push({
        label: formatSegmentLabel(contextSegment, segment),
        path: currentPath,
        // No translation key for dynamic IDs
      });
      continue;
    }

    // Try to find in module registry first (most accurate)
    const module = findModuleByPath(currentPath);
    if (module && module.translationKey) {
      breadcrumbs.push({
        label: module.name,
        path: currentPath,
        translationKey: module.translationKey,
      });
      continue;
    }

    // Check for action segments (Vietnamese and English)
    const allActions = ['add', 'edit', 'new', 'detail', 'view', 'them', 'sua', 'moi', 'chi-tiet', 'xem', 'xoa', 'sao-chep'];
    if (allActions.includes(segment)) {
      const actionKey = normalizeAction(segment);
      breadcrumbs.push({
        label: formatActionLabel(segment),
        path: currentPath,
        translationKey: `common.${actionKey}`,
      });
      continue;
    }

    // Check common segments map
    if (commonSegments[segment]) {
      breadcrumbs.push({
        label: formatSegment(segment),
        path: currentPath,
        translationKey: commonSegments[segment],
      });
      continue;
    }

    // Default: format segment as readable label
    breadcrumbs.push({
      label: formatSegment(segment),
      path: currentPath,
    });
  }

  return breadcrumbs;
}

/**
 * Find context segment (the main module name, skipping actions)
 */
function findContextSegment(segments: string[], currentIndex: number): string {
  // Look backwards for the main segment (skip actions and category prefixes)
  const actions = ['add', 'edit', 'new', 'detail', 'view', 'them', 'sua', 'moi', 'chi-tiet', 'xem'];
  const categories = ['quan-tri', 'thuong-mai', 'commerce', 'nen-tang', 'tich-hop', 'giam-sat', 'he-thong', 'core'];
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const seg = segments[i];
    if (!actions.includes(seg) && !categories.includes(seg) && !isUUID(seg) && !isNumericId(seg)) {
      return seg;
    }
  }
  
  return segments[currentIndex - 1] || 'item';
}

/**
 * Normalize action to standard key
 */
function normalizeAction(action: string): string {
  const actionMap: Record<string, string> = {
    'them': 'add',
    'moi': 'new',
    'sua': 'edit',
    'chi-tiet': 'detail',
    'xem': 'view',
    'xoa': 'delete',
    'sao-chep': 'duplicate',
    'add': 'add',
    'new': 'new',
    'edit': 'edit',
    'detail': 'detail',
    'view': 'view',
    'delete': 'delete',
    'duplicate': 'duplicate',
  };
  return actionMap[action] || action;
}

/**
 * Find module by path
 */
function findModuleByPath(path: string): any {
  const registry = ModuleRegistry.getInstance();
  const modules = registry.getEnabledModules();

  for (const module of modules) {
    // Check main route
    if (module.route && path.includes(module.route)) {
      return module;
    }

    // Check menu items
    if (module.menuItems) {
      const menuItem = findMenuItemByPath(module.menuItems, path);
      if (menuItem) {
        return {
          name: menuItem.label,
          translationKey: menuItem.translationKey || menuItem.label,
        };
      }
    }
  }

  return null;
}

/**
 * Find menu item by path recursively
 */
function findMenuItemByPath(menuItems: any[], path: string): any {
  for (const item of menuItems) {
    if (item.path && path.includes(item.path)) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Check if string is UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is numeric ID
 */
function isNumericId(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Format segment label for IDs
 */
function formatSegmentLabel(type: string, id: string): string {
  // Shorten UUID for display
  if (isUUID(id)) {
    return `${formatSegment(type)} #${id.substring(0, 8)}`;
  }
  return `${formatSegment(type)} #${id}`;
}

/**
 * Format action label (supports both Vietnamese and English)
 */
function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    // English
    'add': 'Add',
    'edit': 'Edit',
    'new': 'New',
    'detail': 'Detail',
    'view': 'View',
    'delete': 'Delete',
    'duplicate': 'Duplicate',
    // Vietnamese
    'them': 'Thêm',
    'sua': 'Sửa',
    'moi': 'Mới',
    'chi-tiet': 'Chi tiết',
    'xem': 'Xem',
    'xoa': 'Xóa',
    'sao-chep': 'Sao chép',
  };
  return labels[action] || formatSegment(action);
}

/**
 * Format segment to readable label
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}