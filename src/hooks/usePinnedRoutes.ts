/**
 * usePinnedRoutes Hook
 * Manage pinned routes with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS, LIMITS } from '../constants/app';
import { getStorageItem, setStorageItem } from '../lib/storage';

/**
 * Hook for managing pinned routes
 * @returns Object with pinned routes and methods to manage them
 * 
 * @example
 * const { pinnedRoutes, isPinned, togglePin, clearPins } = usePinnedRoutes();
 */
export function usePinnedRoutes() {
  const [pinnedRoutes, setPinnedRoutes] = useState<string[]>(() => 
    getStorageItem<string[]>(STORAGE_KEYS.pinnedRoutes, [])
  );

  // Sync to localStorage whenever pinnedRoutes changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.pinnedRoutes, pinnedRoutes);
  }, [pinnedRoutes]);

  /**
   * Check if a route is pinned
   */
  const isPinned = useCallback((path: string): boolean => {
    return pinnedRoutes.includes(path);
  }, [pinnedRoutes]);

  /**
   * Toggle pin status of a route
   */
  const togglePin = useCallback((path: string) => {
    setPinnedRoutes(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        // Enforce max limit
        const newPins = [...prev, path];
        if (newPins.length > LIMITS.pinnedRoutes) {
          return newPins.slice(-LIMITS.pinnedRoutes);
        }
        return newPins;
      }
    });
  }, []);

  /**
   * Pin a route
   */
  const pin = useCallback((path: string) => {
    setPinnedRoutes(prev => {
      if (prev.includes(path)) return prev;
      const newPins = [...prev, path];
      if (newPins.length > LIMITS.pinnedRoutes) {
        return newPins.slice(-LIMITS.pinnedRoutes);
      }
      return newPins;
    });
  }, []);

  /**
   * Unpin a route
   */
  const unpin = useCallback((path: string) => {
    setPinnedRoutes(prev => prev.filter(p => p !== path));
  }, []);

  /**
   * Clear all pinned routes
   */
  const clearPins = useCallback(() => {
    setPinnedRoutes([]);
  }, []);

  return {
    pinnedRoutes,
    isPinned,
    togglePin,
    pin,
    unpin,
    clearPins,
  };
}
