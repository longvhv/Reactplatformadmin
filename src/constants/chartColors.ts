/**
 * Chart Colors Constants
 * Provides color values for chart libraries (Recharts, etc.)
 * that require hex/RGB values instead of Tailwind classes
 */

/**
 * Get computed CSS variable value from design tokens
 */
function getCSSVar(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Primary chart color palette
 * Based on design tokens defined in globals.css
 */
export const CHART_COLORS = {
  // Primary colors
  primary: '#6366f1',      // Indigo
  secondary: '#8b5cf6',    // Purple
  accent: '#ec4899',       // Pink
  warning: '#f59e0b',      // Amber
  success: '#10b981',      // Emerald
  
  // Additional chart colors
  blue: '#3b82f6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#f472b6',
  purple: '#a855f7',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  
  // Grays (for backgrounds/borders in charts)
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  
  // Chart-specific grays (for axes, grids, etc.)
  chartGrid: '#e5e7eb',    // Light gray for grid lines
  chartAxis: '#9ca3af',    // Medium gray for axis labels
  chartAxisAlt: '#6b7280', // Alternative axis color
} as const;

/**
 * Chart UI colors for tooltips, backgrounds, etc.
 */
export const CHART_UI = {
  tooltip: {
    background: 'rgba(255, 255, 255, 0.95)',
    backgroundDark: 'rgba(26, 26, 26, 0.95)',
    border: '#e5e7eb',
    borderDark: '#3f3f46',
  },
  grid: {
    stroke: '#e5e7eb',
    strokeDark: '#3f3f46',
    opacity: 0.3,
  },
} as const;