/**
 * Standard Page Layout Component
 * 
 * Provides consistent layout structure for all pages:
 * - Page header with icon and title
 * - Optional description
 * - Optional actions (buttons, filters, etc.)
 * - Content area
 * 
 * Usage:
 * ```tsx
 * <PageLayout
 *   icon={Users}
 *   title="Quản lý Người dùng"
 *   description="Quản lý tài khoản, quyền hạn và ủy quyền"
 *   actions={<Button>Thêm mới</Button>}
 * >
 *   <Card>Content here</Card>
 * </PageLayout>
 * ```
 */

import { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface PageLayoutProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
}

export function PageLayout({
  icon: Icon,
  title,
  description,
  actions,
  children,
  headerClassName = '',
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 ${headerClassName}`}>
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {children}
    </div>
  );
}

/**
 * Page Section Component
 * For grouping related content within a page
 */
interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className = '',
}: PageSectionProps) {
  return (
    <div className={className}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
