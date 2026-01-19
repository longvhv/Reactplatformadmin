/**
 * Audit Logs Module
 * 
 * Module quản lý lịch sử hoạt động và kiểm toán hệ thống
 */

import { lazy, Suspense } from 'react';
import { Shield } from 'lucide-react';

// Lazy load pages
const AuditLogsPage = lazy(() => import('../../pages/AuditLogsPage'));
const AuditLogDetailPage = lazy(() => import('../../pages/AuditLogDetailPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

// Module metadata
export const auditLogsModule = {
  id: 'audit-logs',
  name: 'Audit Logs',
  icon: Shield,
  description: 'Quản lý lịch sử hoạt động và kiểm toán hệ thống',
  
  // Navigation menu items
  menuItems: [
    {
      id: 'audit-logs',
      label: 'Lịch sử truy cập',
      path: '/admin/audit-logs',
      icon: Shield,
      order: 100,
    },
  ],

  // Routes
  routes: [
    {
      path: '/admin/audit-logs',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AuditLogsPage />
        </Suspense>
      ),
    },
    {
      path: '/admin/audit-logs/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AuditLogDetailPage />
        </Suspense>
      ),
    },
  ],

  // Permissions required
  permissions: ['audit_logs.view'],
};

export default auditLogsModule;

// Named export for consistency
export { auditLogsModule as AuditLogsModule };