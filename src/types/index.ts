/**
 * TypeScript Type Definitions
 * Centralized type definitions for the application
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ActualTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  actualTheme: ActualTheme;
  setTheme: (theme: ThemeMode) => void;
}

// Language Types
export type LanguageCode = 'vi' | 'en';

export interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

// Navigation Types
export interface Route {
  path: string;
  element: ReactNode;
  title?: string;
  icon?: ReactNode;
  meta?: RouteMeta;
}

export interface RouteMeta {
  requiresAuth?: boolean;
  roles?: string[];
  description?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
}

export interface Module {
  id: string;
  name: string;
  icon?: ReactNode;
  routes: Route[];
  enabled?: boolean;
  showInSidebar?: boolean;
  menuItems?: MenuItem[];
  priority?: number;
}

// Search Types
export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  category: string;
  action: () => void;
  keywords: string[];
}

export interface RecentSearch {
  id: number;
  text: string;
  icon: LucideIcon;
}

// Layout Types
export interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: ThemeMode;
  actualTheme: ActualTheme;
  onCycleTheme: () => void;
  onSetTheme?: (theme: ThemeMode) => void;
  sidebarCollapsed?: boolean;
}

export interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

// Component Props Types
export interface TooltipProps {
  content: string;
  children: ReactNode;
  disabled?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: Date;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: 'online' | 'offline' | 'away';
}

// State Management Types
export interface AppState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  language: LanguageCode;
  pinnedRoutes: string[];
  recentRoutes: string[];
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
