/**
 * useSidebarState Hook
 * Manage sidebar state with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/app';
import { getStorageItem, setStorageItem } from '../lib/storage';

/**
 * Hook for managing sidebar state
 * @returns Object with sidebar state and methods to control it
 * 
 * @example
 * const { sidebarOpen, sidebarCollapsed, toggleSidebar, ... } = useSidebarState();
 */
export function useSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => 
    getStorageItem<boolean>(STORAGE_KEYS.sidebarCollapsed, false)
  );

  // Sync collapsed state to localStorage
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.sidebarCollapsed, sidebarCollapsed);
  }, [sidebarCollapsed]);

  /**
   * Open sidebar (mobile)
   */
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  /**
   * Close sidebar (mobile)
   */
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  /**
   * Toggle sidebar open/close (mobile)
   */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  /**
   * Collapse sidebar (desktop)
   */
  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  /**
   * Expand sidebar (desktop)
   */
  const expandSidebar = useCallback(() => {
    setSidebarCollapsed(false);
  }, []);

  /**
   * Toggle sidebar collapsed/expanded (desktop)
   */
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return {
    sidebarOpen,
    sidebarCollapsed,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    toggleSidebarCollapse,
  };
}
