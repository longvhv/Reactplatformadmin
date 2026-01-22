/**
 * Toast Utility Functions
 * 
 * Wrapper around sonner with standardized toast notifications
 * 
 * Usage:
 * ```tsx
 * import { showToast } from '../lib/toast';
 * 
 * showToast.success('Success!', 'Your changes have been saved.');
 * showToast.error('Error!', 'Something went wrong.');
 * showToast.warning('Warning!', 'Please check your input.');
 * showToast.info('Info', 'New update available.');
 * ```
 */

import { toast as sonnerToast } from 'sonner@2.0.3';
import { Toast, ToastDurations, type ToastVariant } from '../components/ui/toast';
import { ReactNode } from 'react';

interface ToastOptions {
  description?: string;
  duration?: number;
  icon?: ReactNode;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

/**
 * Base toast function
 */
function createToast(
  variant: ToastVariant,
  title: string,
  options?: ToastOptions
) {
  const { description, duration, icon, position = 'top-right' } = options || {};
  
  // Use variant-specific duration if not provided
  const toastDuration = duration ?? ToastDurations[variant];

  // Convert position to sonner position format
  const sonnerPosition = position.replace('-', '-') as any;

  return sonnerToast.custom(
    (t) => (
      <Toast
        variant={variant}
        title={title}
        description={description}
        icon={icon}
        onClose={() => sonnerToast.dismiss(t)}
      />
    ),
    {
      duration: toastDuration,
      position: sonnerPosition,
    }
  );
}

/**
 * Toast API
 */
export const showToast = {
  /**
   * Success toast (green, 3s)
   */
  success: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return createToast('success', title, { description, ...options });
  },

  /**
   * Error toast (red, 5s)
   */
  error: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return createToast('error', title, { description, ...options });
  },

  /**
   * Warning toast (amber, 4s)
   */
  warning: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return createToast('warning', title, { description, ...options });
  },

  /**
   * Info toast (blue, 3s)
   */
  info: (title: string, description?: string, options?: Omit<ToastOptions, 'description'>) => {
    return createToast('info', title, { description, ...options });
  },

  /**
   * Custom toast with all options
   */
  custom: (
    variant: ToastVariant,
    title: string,
    options?: ToastOptions
  ) => {
    return createToast(variant, title, options);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

/**
 * Legacy compatibility - map old toast API
 */
export const toast = {
  success: showToast.success,
  error: showToast.error,
  warning: showToast.warning,
  info: showToast.info,
  dismiss: showToast.dismiss,
};

export default showToast;