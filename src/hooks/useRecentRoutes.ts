/**
 * useRecentRoutes Hook
 * Track recently visited routes with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { STORAGE_KEYS, LIMITS } from '../constants/app';
import { getStorageItem, setStorageItem } from '../lib/storage';

/**
 * Hook for tracking recently visited routes
 * @returns Object with recent routes and methods to manage them
 * 
 * @example
 * const { recentRoutes, addRecent, clearRecent } = useRecentRoutes();
 */
export function useRecentRoutes() {
  const location = useLocation();
  const [recentRoutes, setRecentRoutes] = useState<string[]>(() => 
    getStorageItem<string[]>(STORAGE_KEYS.recentRoutes, [])
  );

  // Sync to localStorage whenever recentRoutes changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.recentRoutes, recentRoutes);
  }, [recentRoutes]);

  // Track current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't track root path
    if (currentPath === '/') return;
    
    // Don't add if already the most recent
    if (recentRoutes[0] === currentPath) return;
    
    setRecentRoutes(prev => {
      // Remove if already in list
      const filtered = prev.filter(path => path !== currentPath);
      
      // Add to front and enforce limit
      const updated = [currentPath, ...filtered];
      return updated.slice(0, LIMITS.recentRoutes);
    });
  }, [location.pathname]);

  /**
   * Manually add a route to recent
   */
  const addRecent = useCallback((path: string) => {
    if (path === '/') return;
    
    setRecentRoutes(prev => {
      const filtered = prev.filter(p => p !== path);
      const updated = [path, ...filtered];
      return updated.slice(0, LIMITS.recentRoutes);
    });
  }, []);

  /**
   * Remove a route from recent
   */
  const removeRecent = useCallback((path: string) => {
    setRecentRoutes(prev => prev.filter(p => p !== path));
  }, []);

  /**
   * Clear all recent routes
   */
  const clearRecent = useCallback(() => {
    setRecentRoutes([]);
  }, []);

  return {
    recentRoutes,
    addRecent,
    removeRecent,
    clearRecent,
  };
}
