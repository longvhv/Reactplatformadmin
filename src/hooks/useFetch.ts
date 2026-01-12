import { useState, useEffect, useCallback } from "react";
import { requestCache, globalCache } from "../utils/cache";

interface UseFetchOptions {
  cache?: boolean;
  cacheTTL?: number;
  dedupe?: boolean;
  retry?: number;
  retryDelay?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook cho data fetching với caching và deduplication
 * 
 * @example
 * const { data, loading, error, refetch } = useFetch('/api/users', {
 *   cache: true,
 *   dedupe: true,
 * });
 */
export function useFetch<T = any>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const {
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    dedupe = true,
    retry = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (attempt = 0): Promise<void> => {
      if (!url) return;

      // Check cache first
      if (cache) {
        const cached = globalCache.get(url);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const fetchFn = async () => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        };

        // Use deduplication if enabled
        const result = dedupe
          ? await requestCache.dedupe(url, fetchFn)
          : await fetchFn();

        setData(result);

        // Cache result
        if (cache) {
          globalCache.set(url, result, cacheTTL);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");

        // Retry logic
        if (attempt < retry) {
          setTimeout(() => {
            fetchData(attempt + 1);
          }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
          return;
        }

        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [url, cache, cacheTTL, dedupe, retry, retryDelay]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    // Clear cache for this URL
    if (url && cache) {
      globalCache.delete(url);
    }
    await fetchData();
  }, [url, cache, fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook cho POST/PUT/DELETE requests
 */
interface UseMutationOptions<TVariables = any> {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TVariables> = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}
