/**
 * Static Menu Configuration
 * 
 * Menu items load immediately, independent of module loading
 * This ensures sidebar menu is always visible even during lazy loading
 * 
 * 🌐 PATH STRUCTURE (Standardized English):
 * - Main: /quan-tri/*
 * - Commerce: /commerce/*
 * - Platform: /nen-tang/*
 * - Integrations: /tich-hop/*
 * - Telemetry: /giam-sat/*
 * - System: /he-thong/*
 */

import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  UserCog,
  Settings,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  Webhook,
  Clock,
  BarChart3,
  Key,
  Grid3x3,
  MapPin,
  Bell,
  Flag,
  Briefcase,
  FolderKanban,
  Database,
  HelpCircle,
  FileCode,
  Activity,
  Globe,
  Layers,
  Box,
  Boxes,
  Receipt,
  ShoppingBag,
  Image,
  Truck,
  Gauge,
  Ban,
  Megaphone,
  Timer,
  FileKey,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItemConfig {
  id: string;
  label: string;
  translationKey: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  children?: MenuItemConfig[];
}

export interface MenuGroupConfig {
  id: string;
  label: string;
  translationKey: string;
  items: MenuItemConfig[];
}

/**
 * Complete Menu Structure
 * Matches module registry but loads independently
 */
export const MENU_GROUPS: MenuGroupConfig[] = [
  // ============================================
  // MAIN
  // ============================================
  {
    id: 'main',
    label: 'CHÍNH',
    translationKey: 'menu.groups.main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        translationKey: 'navigation.dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },

  // ============================================
  // IDENTITY & ACCESS
  // ============================================
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    translationKey: 'menu.groups.identity',
    items: [
      {
        id: 'tenants',
        label: 'Tenants',
        translationKey: 'navigation.tenants',
        path: '/admin/tenants',
        icon: Building2,
      },
      {
        id: 'users',
        label: 'Users',
        translationKey: 'navigation.users',
        path: '/platform/users',
        icon: Users,
      },
      {
        id: 'user-delegations',
        label: 'User Delegations',
        translationKey: 'navigation.userDelegations',
        path: '/platform/user-delegations',
        icon: UserCog,
      },
      {
        id: 'roles',
        label: 'Roles',
        translationKey: 'navigation.roles',
        path: '/platform/roles',
        icon: Shield,
      },
      {
        id: 'permissions',
        label: 'Permissions',
        translationKey: 'navigation.permissions',
        path: '/platform/permissions',
        icon: Key,
      },
      {
        id: 'auth-logs',
        label: 'Auth Logs',
        translationKey: 'navigation.authLogs',
        path: '/admin/auth-logs',
        icon: Activity,
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        translationKey: 'navigation.auditLogs',
        path: '/admin/audit-logs',
        icon: FileText,
      },
    ],
  },

  // ============================================
  // COMMERCE & PAYMENTS
  // ============================================
  {
    id: 'commerce',
    label: 'THƯƠNG MẠI & THANH TOÁN',
    translationKey: 'menu.groups.commerce',
    items: [
      {
        id: 'products',
        label: 'Products',
        translationKey: 'navigation.products',
        path: '/commerce/products',
        icon: Package,
      },
      {
        id: 'saas-product-types',
        label: 'SaaS Product Types',
        translationKey: 'navigation.saasProductTypes',
        path: '/platform/saas-product-types',
        icon: Box,
      },
      {
        id: 'service-packages',
        label: 'Service Packages',
        translationKey: 'navigation.servicePackages',
        path: '/platform/service-packages',
        icon: Briefcase,
      },
      {
        id: 'subscription-orders',
        label: 'Subscription Orders',
        translationKey: 'navigation.subscriptionOrders',
        path: '/commerce/subscription-orders',
        icon: ShoppingCart,
      },
      {
        id: 'subscription-invoices',
        label: 'Subscription Invoices',
        translationKey: 'navigation.subscriptionInvoices',
        path: '/commerce/subscription-invoices',
        icon: Receipt,
      },
      {
        id: 'tenant-subscriptions',
        label: 'Tenant Subscriptions',
        translationKey: 'navigation.tenantSubscriptions',
        path: '/commerce/tenant-subscriptions',
        icon: CreditCard,
      },
      {
        id: 'digital-assets',
        label: 'Digital Assets',
        translationKey: 'navigation.digitalAssets',
        path: '/commerce/digital-assets',
        icon: Image,
      },
      {
        id: 'service-deliveries',
        label: 'Service Deliveries',
        translationKey: 'navigation.serviceDeliveries',
        path: '/commerce/service-deliveries',
        icon: Truck,
      },
    ],
  },

  // ============================================
  // PLATFORM & CONFIGURATION
  // ============================================
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    translationKey: 'menu.groups.platform',
    items: [
      {
        id: 'applications',
        label: 'Applications',
        translationKey: 'navigation.applications',
        path: '/platform/applications',
        icon: Grid3x3,
      },
      {
        id: 'system-categories',
        label: 'System Categories',
        translationKey: 'navigation.systemCategories',
        path: '/platform/system-categories',
        icon: FolderKanban,
      },
      {
        id: 'location-types',
        label: 'Location Types',
        translationKey: 'navigation.locationTypes',
        path: '/platform/location-types',
        icon: Layers,
      },
      {
        id: 'rate-limits',
        label: 'Rate Limits',
        translationKey: 'navigation.rateLimits',
        path: '/platform/rate-limits',
        icon: Gauge,
      },
      {
        id: 'reserved-slugs',
        label: 'Reserved Slugs',
        translationKey: 'navigation.reservedSlugs',
        path: '/platform/reserved-slugs',
        icon: Ban,
      },
      {
        id: 'system-announcements',
        label: 'System Announcements',
        translationKey: 'navigation.systemAnnouncements',
        path: '/platform/system-announcements',
        icon: Megaphone,
      },
      {
        id: 'system-jobs',
        label: 'System Jobs',
        translationKey: 'navigation.systemJobs',
        path: '/platform/system-jobs',
        icon: Timer,
      },
      {
        id: 'feature-flags',
        label: 'Feature Flags',
        translationKey: 'navigation.featureFlags',
        path: '/platform/feature-flags',
        icon: Flag,
      },
      {
        id: 'notification-templates',
        label: 'Notification Templates',
        translationKey: 'navigation.notificationTemplates',
        path: '/platform/notification-templates',
        icon: Bell,
      },
      {
        id: 'legal-documents',
        label: 'Legal Documents',
        translationKey: 'navigation.legalDocuments',
        path: '/platform/legal-documents',
        icon: FileKey,
      },
    ],
  },

  // ============================================
  // INTEGRATIONS & API
  // ============================================
  {
    id: 'integrations',
    label: 'TÍCH HỢP & API',
    translationKey: 'menu.groups.integrations',
    items: [
      {
        id: 'webhooks',
        label: 'Webhooks',
        translationKey: 'navigation.webhooks',
        path: '/integrations/webhooks',
        icon: Webhook,
      },
      {
        id: 'api-usage-logs',
        label: 'API Usage Logs',
        translationKey: 'navigation.apiUsageLogs',
        path: '/integrations/api-usage-logs',
        icon: Database,
      },
    ],
  },

  // ============================================
  // TELEMETRY & REPORTS
  // ============================================
  {
    id: 'telemetry',
    label: 'GIÁM SÁT & BÁO CÁO',
    translationKey: 'menu.groups.telemetry',
    items: [
      {
        id: 'user-registration-telemetry',
        label: 'User Registration',
        translationKey: 'navigation.userRegistrationTelemetry',
        path: '/admin/registration-analytics',
        icon: UserCheck,
      },
      {
        id: 'traffic-logs',
        label: 'Traffic Logs',
        translationKey: 'navigation.trafficLogs',
        path: '/platform/traffic-logs',
        icon: Globe,
      },
    ],
  },

  // ============================================
  // SYSTEM & SUPPORT
  // ============================================
  {
    id: 'system',
    label: 'HỆ THỐNG & HỖ TRỢ',
    translationKey: 'menu.groups.system',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        translationKey: 'navigation.settings',
        path: '/system/settings',
        icon: Settings,
      },
      {
        id: 'help',
        label: 'Help',
        translationKey: 'navigation.help',
        path: '/system/help',
        icon: HelpCircle,
      },
      {
        id: 'dev-docs',
        label: 'Developer Docs',
        translationKey: 'navigation.devDocs',
        path: '/system/dev-docs',
        icon: FileCode,
      },
    ],
  },
];

/**
 * Get all menu items as flat array
 */
export function getAllMenuItems(): MenuItemConfig[] {
  const items: MenuItemConfig[] = [];
  
  MENU_GROUPS.forEach(group => {
    group.items.forEach(item => {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    });
  });
  
  return items;
}

/**
 * Find menu item by path
 */
export function findMenuItemByPath(path: string): MenuItemConfig | undefined {
  return getAllMenuItems().find(item => item.path === path);
}

/**
 * Find menu item by id
 */
export function findMenuItemById(id: string): MenuItemConfig | undefined {
  return getAllMenuItems().find(item => item.id === id);
}