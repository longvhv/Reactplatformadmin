import React, { ReactNode } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // For stats or additional content
  className?: string;
}

/**
 * Standard Page Header Component
 * Provides a consistent header layout across the application.
 */
export const PageHeader = ({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
}: PageHeaderProps) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <div className="text-primary">
                  {icon}
                </div>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              {actions}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};