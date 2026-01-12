/**
 * API Endpoints
 * Centralized endpoint definitions
 */

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },

  // User
  user: {
    profile: '/user/profile',
    update: '/user/profile',
    avatar: '/user/avatar',
    password: '/user/password',
    sessions: '/user/sessions',
  },

  // Notifications
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    settings: '/notifications/settings',
  },

  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    activities: '/dashboard/activities',
    charts: '/dashboard/charts',
  },

  // Settings
  settings: {
    get: '/settings',
    update: '/settings',
    appearance: '/settings/appearance',
    security: '/settings/security',
  },
} as const;
