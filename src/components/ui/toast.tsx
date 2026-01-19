/**
 * Toast Notification System
 * 
 * Standardized toast notifications with 4 variants:
 * - Success (green, 3s)
 * - Error (red, 5s)
 * - Warning (amber, 4s)
 * - Info (blue, 3s)
 */

import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
}

const variantStyles = {
  success: {
    container: 'bg-green-100 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    description: 'text-green-700',
    defaultIcon: CheckCircle2,
  },
  error: {
    container: 'bg-red-100 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    description: 'text-red-700',
    defaultIcon: XCircle,
  },
  warning: {
    container: 'bg-amber-100 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-800',
    description: 'text-amber-700',
    defaultIcon: AlertCircle,
  },
  info: {
    container: 'bg-blue-100 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    description: 'text-blue-700',
    defaultIcon: Info,
  },
};

/**
 * Toast Component
 */
export function Toast({ 
  variant = 'success', 
  title, 
  description, 
  icon,
  onClose 
}: ToastProps) {
  const styles = variantStyles[variant];
  const IconComponent = icon || styles.defaultIcon;

  return (
    <div className={`
      flex items-start gap-3
      min-w-[320px] max-w-[500px]
      px-4 py-3 rounded-lg
      border shadow-md
      animate-in slide-in-from-right-full fade-in-0 duration-300
      ${styles.container}
    `}>
      {/* Icon */}
      <div className="flex-shrink-0 rounded-full p-1 bg-white">
        {typeof IconComponent === 'function' ? (
          <IconComponent className={`w-5 h-5 ${styles.icon}`} />
        ) : (
          IconComponent
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className={`font-medium text-[14px] leading-tight ${styles.title}`}>
          {title}
        </div>
        {description && (
          <div className={`text-[13px] mt-1 leading-snug ${styles.description}`}>
            {description}
          </div>
        )}
      </div>
      
      {/* Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className={`flex-shrink-0 hover:opacity-80 transition-opacity ${styles.icon}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Toast Position Variants
 */
export const ToastPositions = {
  'top-right': 'fixed top-4 right-4 z-[100]',
  'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-[100]',
  'bottom-right': 'fixed bottom-4 right-4 z-[100]',
  'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]',
} as const;

export type ToastPosition = keyof typeof ToastPositions;

/**
 * Toast Durations (in milliseconds)
 */
export const ToastDurations = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
} as const;
