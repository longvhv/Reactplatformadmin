/**
 * useOptimistic Hook
 * Optimistic UI updates with rollback
 */

import { useState, useCallback } from 'react';

interface UseOptimisticOptions<T> {
  onError?: (error: Error, rollback: () => void) => void;
}

export function useOptimistic<T>(
  initialValue: T,
  options: UseOptimisticOptions<T> = {}
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const updateOptimistic = useCallback(
    async (
      optimisticValue: T,
      asyncAction: () => Promise<T>
    ): Promise<T> => {
      const previousValue = value;

      // Apply optimistic update immediately
      setValue(optimisticValue);
      setIsOptimistic(true);

      try {
        // Perform async action
        const result = await asyncAction();
        
        // Update with real value
        setValue(result);
        setIsOptimistic(false);
        
        return result;
      } catch (error) {
        // Rollback on error
        const rollback = () => {
          setValue(previousValue);
          setIsOptimistic(false);
        };

        if (options.onError) {
          options.onError(error as Error, rollback);
        } else {
          rollback();
        }

        throw error;
      }
    },
    [value, options]
  );

  return {
    value,
    isOptimistic,
    updateOptimistic,
    setValue,
  };
}
