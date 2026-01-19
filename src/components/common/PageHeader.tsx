/**
 * Page Header Component
 * Standardized page header với tiêu đề 24px
 */

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
