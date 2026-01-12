/**
 * Application Constants
 * Centralized configuration for the application
 */

export const APP_CONFIG = {
  name: 'VHV Platform',
  description: 'React Framework',
  version: '2.0.0',
  copyright: '© 2025 VHV Platform',
} as const;

export const LAYOUT_CONFIG = {
  sidebar: {
    width: {
      expanded: 'w-64',
      collapsed: 'w-20',
      expandedPx: 256,
      collapsedPx: 80,
    },
    animation: {
      duration: 300,
      easing: 'ease-in-out',
    },
  },
  header: {
    height: {
      mobile: 'h-16',
      desktop: 'h-24',
    },
  },
  search: {
    minWidth: {
      default: 'min-w-[300px]',
      large: 'lg:min-w-[360px]',
    },
    maxResults: 5,
  },
} as const;

export const ANIMATION_CONFIG = {
  transition: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: {
    default: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const THEME_CONFIG = {
  modes: ['light', 'dark', 'system'] as const,
  storageKey: 'vhv-theme',
} as const;

export const STORAGE_KEYS = {
  theme: 'vhv-theme',
  language: 'vhv-language',
  pinnedRoutes: 'vhv-pinned-routes',
  recentRoutes: 'vhv-recent-routes',
  sidebarCollapsed: 'vhv-sidebar-collapsed',
} as const;

export const LIMITS = {
  recentSearches: 5,
  recentRoutes: 5,
  pinnedRoutes: 10,
} as const;
