/**
 * Simple Breadcrumb Utility
 * Structure: Home > Current Page
 * 
 * Simple 2-level breadcrumb for flat navigation
 */

import { MENU_GROUPS } from '../constants/menu-config';

export interface BreadcrumbItem {
  label: string;
  path: string;
  translationKey?: string;
}

/**
 * Generate simple breadcrumb: Home > Current Page
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Normalize pathname
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  // Always start with Home
  breadcrumbs.push({
    label: 'Trang chủ',
    path: '/quan-tri/trang-chu',
    translationKey: 'navigation.dashboard',
  });

  // If we're on dashboard/home, return only home breadcrumb
  if (normalizedPath === '/quan-tri/trang-chu' || 
      normalizedPath === '/' || 
      normalizedPath === '') {
    return breadcrumbs;
  }

  // Find current page in menu config
  const currentPage = findPageInMenu(normalizedPath);
  
  if (currentPage) {
    breadcrumbs.push({
      label: currentPage.label,
      path: currentPage.path,
      translationKey: currentPage.translationKey,
    });
  } else {
    // Fallback: use last segment
    const segments = normalizedPath.split('/').filter(x => x);
    const lastSegment = segments[segments.length - 1];
    
    // Check if it's an action (them, sua, chi-tiet, etc.)
    const actionLabels: Record<string, string> = {
      'them': 'Thêm mới',
      'them-moi': 'Thêm mới',
      'sua': 'Chỉnh sửa',
      'chinh-sua': 'Chỉnh sửa',
      'chi-tiet': 'Chi tiết',
      'xem': 'Xem',
      // English actions
      'add': 'Thêm mới',
      'edit': 'Chỉnh sửa',
      'view': 'Xem',
      'detail': 'Chi tiết',
    };

    if (actionLabels[lastSegment]) {
      // For actions, try to get parent page
      const parentPath = segments.slice(0, -1).join('/');
      const parentPage = findPageInMenu(`/${parentPath}`);
      
      if (parentPage) {
        breadcrumbs.push({
          label: `${parentPage.label} - ${actionLabels[lastSegment]}`,
          path: normalizedPath,
        });
      } else {
        breadcrumbs.push({
          label: actionLabels[lastSegment],
          path: normalizedPath,
        });
      }
    } else {
      // Try to get parent from path
      const parentPath = segments.slice(0, -1).join('/');
      const parentPage = findPageInMenu(`/${parentPath}`);
      
      if (parentPage) {
        breadcrumbs.push({
          label: parentPage.label,
          path: normalizedPath,
        });
      } else {
        // Just use formatted last segment
        breadcrumbs.push({
          label: formatSegment(lastSegment),
          path: normalizedPath,
        });
      }
    }
  }

  return breadcrumbs;
}

/**
 * Find page in menu configuration
 */
function findPageInMenu(path: string): { label: string; path: string; translationKey: string } | null {
  for (const group of MENU_GROUPS) {
    for (const item of group.items) {
      if (item.path === path) {
        return {
          label: item.label,
          path: item.path,
          translationKey: item.translationKey,
        };
      }
      // Check children if exists
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            return {
              label: child.label,
              path: child.path,
              translationKey: child.translationKey,
            };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Format Vietnamese path segment to readable text
 */
function formatSegment(segment: string): string {
  // Common Vietnamese path translations
  const translations: Record<string, string> = {
    'quan-tri': 'Quản trị',
    'thuong-mai': 'Thương mại',
    'nen-tang': 'Nền tảng',
    'tich-hop': 'Tích hợp',
    'giam-sat': 'Giám sát',
    'he-thong': 'Hệ thống',
    'to-chuc': 'Tổ chức',
    'nguoi-dung': 'Người dùng',
    'vai-tro': 'Vai trò',
    'quyen-han': 'Quyền hạn',
    'san-pham': 'Sản phẩm',
    'don-hang': 'Đơn hàng',
    'ung-dung': 'Ứng dụng',
    // English segments
    'commerce': 'Thương mại',
    'service-packages': 'Gói dịch vụ',
    'saas-product-types': 'Loại sản phẩm SaaS',
    'products': 'Sản phẩm',
    'subscription-orders': 'Đơn hàng đăng ký',
    'subscription-invoices': 'Hóa đơn đăng ký',
    'tenant-subscriptions': 'Đăng ký tổ chức',
    'digital-assets': 'Tài sản số',
    'service-deliveries': 'Giao dịch vụ',
    'product-types': 'Loại sản phẩm',
  };

  return translations[segment] || segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}