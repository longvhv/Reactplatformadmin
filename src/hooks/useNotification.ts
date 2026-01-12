/**
 * useNotification Hook
 * Toast notifications wrapper
 */

import { toast } from 'sonner@2.0.3';

export function useNotification() {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 4000,
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 3500,
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  };

  return {
    success,
    error,
    info,
    warning,
    promise,
  };
}
