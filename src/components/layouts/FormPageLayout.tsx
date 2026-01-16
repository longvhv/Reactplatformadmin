/**
 * FormPageLayout Component
 * Unified layout for Add/Edit pages across all modules
 * Ensures consistent design following Stripe/GitHub standards
 */

import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface FormPageLayoutProps {
  // Page identity
  title: string;
  description?: string;
  mode: 'add' | 'edit';
  
  // Icon
  icon?: LucideIcon;
  iconClassName?: string;
  
  // Navigation
  backPath: string;
  backLabel?: string;
  
  // Warning/Info banner (optional)
  banner?: {
    type: 'info' | 'warning' | 'error';
    title?: string;
    message: string;
    icon?: LucideIcon;
  };
  
  // Content
  children: ReactNode;
  
  // Optional custom header content
  headerExtra?: ReactNode;
}

export function FormPageLayout({
  title,
  description,
  mode,
  icon: Icon,
  iconClassName = 'text-white',
  backPath,
  backLabel = 'Quay lại',
  banner,
  children,
  headerExtra,
}: FormPageLayoutProps) {
  const navigate = useNavigate();

  const bannerStyles = {
    info: {
      border: 'border-blue-200 dark:border-blue-800',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-800 dark:text-blue-300',
    },
    warning: {
      border: 'border-yellow-200 dark:border-yellow-800',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-800 dark:text-yellow-300',
    },
    error: {
      border: 'border-red-200 dark:border-red-800',
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-800 dark:text-red-300',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(backPath, { replace: true })}
          className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            {Icon && (
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Icon className={`w-6 h-6 ${iconClassName}`} />
              </div>
            )}

            {/* Title & Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {description}
                </p>
              )}
              {headerExtra && (
                <div className="mt-3">
                  {headerExtra}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner (optional) */}
        {banner && (
          <Card className={`mb-6 ${bannerStyles[banner.type].border} ${bannerStyles[banner.type].bg}`}>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                {banner.icon && (
                  <banner.icon className={`w-5 h-5 ${bannerStyles[banner.type].iconColor} flex-shrink-0 mt-0.5`} />
                )}
                <div className={`text-sm ${bannerStyles[banner.type].textColor}`}>
                  {banner.title && (
                    <p className="font-semibold mb-1">{banner.title}</p>
                  )}
                  <p>{banner.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}