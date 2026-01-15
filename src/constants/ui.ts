/**
 * UI Constants & Design Tokens
 * Single source of truth for all UI styling constants
 * Inspired by Stripe/GitHub/Vercel/Linear design systems
 */

import { cn as cnUtil } from '../components/ui/utils';

/**
 * COLORS
 * All colors should use Tailwind design tokens from globals.css
 */
export const UI_COLORS = {
  // Primary actions - Use sparingly, only for main CTAs
  primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  primaryOutline: 'border-primary text-primary hover:bg-primary/10',
  
  // Secondary actions - Common actions
  secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  secondaryOutline: 'border-border text-foreground hover:bg-secondary',
  
  // Destructive actions - Delete, remove, cancel
  destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  destructiveOutline: 'border-destructive text-destructive hover:bg-destructive/10',
  
  // Success states
  success: 'bg-success hover:bg-success/90 text-success-foreground',
  successOutline: 'border-success text-success hover:bg-success/10',
  
  // Warning states  
  warning: 'bg-warning hover:bg-warning/90 text-warning-foreground',
  warningOutline: 'border-warning text-warning hover:bg-warning/10',
  
  // Ghost/minimal buttons
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  
  // Muted/disabled
  muted: 'bg-muted text-muted-foreground',
} as const;

/**
 * SPACING
 * Consistent spacing scale
 */
export const UI_SPACING = {
  // Padding
  paddingXs: 'px-2 py-1',
  paddingSm: 'px-3 py-1.5',
  paddingMd: 'px-4 py-2',
  paddingLg: 'px-6 py-3',
  paddingXl: 'px-8 py-4',
  
  // Gap
  gapXs: 'gap-1',
  gapSm: 'gap-2',
  gapMd: 'gap-3',
  gapLg: 'gap-4',
  gapXl: 'gap-6',
  
  // Margin
  marginXs: 'm-1',
  marginSm: 'm-2',
  marginMd: 'm-4',
  marginLg: 'm-6',
  marginXl: 'm-8',
} as const;

/**
 * BORDER RADIUS
 * Consistent rounded corners
 */
export const UI_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',     // 2px - Subtle, for nested elements
  md: 'rounded-md',     // 6px - Default for most components
  lg: 'rounded-lg',     // 12px - Cards, modals
  xl: 'rounded-xl',     // 16px - Large cards
  full: 'rounded-full', // Pills, avatars
} as const;

/**
 * SHADOWS
 * Consistent elevation system
 */
export const UI_SHADOW = {
  none: 'shadow-none',
  sm: 'shadow-sm',               // Subtle depth
  md: 'shadow-md',               // Default cards
  lg: 'shadow-lg',               // Elevated elements
  xl: 'shadow-xl',               // Modals, popovers
  inner: 'shadow-inner',         // Inset effects
  hoverSm: 'hover:shadow-sm',
  hoverMd: 'hover:shadow-md',
  hoverLg: 'hover:shadow-lg',
  hoverXl: 'hover:shadow-xl',
} as const;

/**
 * BORDERS
 * Consistent border styles
 */
export const UI_BORDER = {
  none: 'border-0',
  default: 'border border-border',
  thick: 'border-2 border-border',
  top: 'border-t border-border',
  bottom: 'border-b border-border',
  left: 'border-l border-border',
  right: 'border-r border-border',
} as const;

/**
 * TYPOGRAPHY
 * Font sizes and weights
 */
export const UI_TEXT = {
  // Sizes
  xs: 'text-xs',     // 12px
  sm: 'text-sm',     // 14px
  base: 'text-base', // 16px
  lg: 'text-lg',     // 18px
  xl: 'text-xl',     // 20px
  '2xl': 'text-2xl', // 24px
  '3xl': 'text-3xl', // 30px
  
  // Weights
  light: 'font-light',       // 300
  normal: 'font-normal',     // 400
  medium: 'font-medium',     // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',         // 700
  
  // Common combinations
  heading1: 'text-2xl font-semibold',
  heading2: 'text-xl font-semibold',
  heading3: 'text-lg font-semibold',
  heading4: 'text-base font-semibold',
  body: 'text-base font-normal',
  caption: 'text-sm text-muted-foreground',
  label: 'text-sm font-medium',
} as const;

/**
 * TRANSITIONS
 * Consistent animation speeds
 */
export const UI_TRANSITION = {
  none: 'transition-none',
  all: 'transition-all duration-200',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
} as const;

/**
 * BUTTON VARIANTS
 * Pre-composed button styles
 */
export const BUTTON_VARIANTS = {
  // Filled buttons
  primary: `${UI_COLORS.primary} ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_TEXT.medium} ${UI_TRANSITION.colors} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`,
  
  secondary: `${UI_COLORS.secondary} ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_TEXT.medium} ${UI_TRANSITION.colors} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`,
  
  destructive: `${UI_COLORS.destructive} ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_TEXT.medium} ${UI_TRANSITION.colors} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`,
  
  // Outline buttons
  outline: `${UI_COLORS.secondaryOutline} ${UI_BORDER.default} ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_TEXT.medium} ${UI_TRANSITION.colors} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`,
  
  // Ghost buttons (no background)
  ghost: `${UI_COLORS.ghost} ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_TEXT.medium} ${UI_TRANSITION.colors} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none`,
  
  // Icon-only buttons (square)
  icon: `${UI_COLORS.ghost} p-2 ${UI_RADIUS.md} ${UI_TRANSITION.colors} inline-flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none`,
} as const;

/**
 * CARD VARIANTS
 * Pre-composed card styles
 */
export const CARD_VARIANTS = {
  default: `bg-card ${UI_BORDER.default} ${UI_RADIUS.lg} ${UI_SHADOW.sm} ${UI_TRANSITION.all} hover:shadow-md p-6`,
  
  flat: `bg-card ${UI_BORDER.default} ${UI_RADIUS.lg} p-6`,
  
  elevated: `bg-card ${UI_BORDER.default} ${UI_RADIUS.lg} ${UI_SHADOW.md} p-6`,
  
  interactive: `bg-card ${UI_BORDER.default} ${UI_RADIUS.lg} ${UI_SHADOW.sm} ${UI_TRANSITION.all} hover:shadow-lg hover:border-primary/50 p-6 cursor-pointer`,
  
  compact: `bg-card ${UI_BORDER.default} ${UI_RADIUS.md} ${UI_SHADOW.sm} p-4`,
} as const;

/**
 * INPUT VARIANTS
 * Pre-composed input styles
 */
export const INPUT_VARIANTS = {
  default: `w-full ${UI_SPACING.paddingMd} ${UI_RADIUS.md} ${UI_BORDER.default} bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${UI_TRANSITION.colors}`,
  
  error: `w-full ${UI_SPACING.paddingMd} ${UI_RADIUS.md} border-2 border-destructive bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive disabled:opacity-50 disabled:cursor-not-allowed ${UI_TRANSITION.colors}`,
  
  success: `w-full ${UI_SPACING.paddingMd} ${UI_RADIUS.md} border-2 border-success bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed ${UI_TRANSITION.colors}`,
} as const;

/**
 * BADGE VARIANTS
 * Pre-composed badge styles
 */
export const BADGE_VARIANTS = {
  default: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} bg-secondary text-secondary-foreground inline-flex items-center gap-1`,
  
  primary: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1`,
  
  success: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} bg-success/10 text-success border border-success/20 inline-flex items-center gap-1`,
  
  warning: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} bg-warning/10 text-warning border border-warning/20 inline-flex items-center gap-1`,
  
  destructive: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} bg-destructive/10 text-destructive border border-destructive/20 inline-flex items-center gap-1`,
  
  outline: `${UI_SPACING.paddingSm} ${UI_RADIUS.md} ${UI_TEXT.xs} ${UI_TEXT.medium} border border-border text-foreground inline-flex items-center gap-1`,
} as const;

/**
 * TABLE STYLES
 * Consistent table styling
 */
export const TABLE_STYLES = {
  container: 'w-full overflow-auto',
  table: 'w-full border-collapse',
  thead: 'bg-muted/50',
  th: 'px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b border-border',
  tbody: '',
  tr: 'border-b border-border hover:bg-muted/50 transition-colors',
  td: 'px-4 py-3 text-sm',
  trLast: 'border-b-0',
} as const;

/**
 * MODAL/DIALOG SIZES
 */
export const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
} as const;

/**
 * HELPER FUNCTIONS
 */

/**
 * Combine multiple class strings safely
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return cnUtil(classes);
}

/**
 * Get button classes
 */
export function getButtonClasses(variant: keyof typeof BUTTON_VARIANTS = 'primary', className?: string): string {
  return cn(BUTTON_VARIANTS[variant], className);
}

/**
 * Get card classes
 */
export function getCardClasses(variant: keyof typeof CARD_VARIANTS = 'default', className?: string): string {
  return cn(CARD_VARIANTS[variant], className);
}

/**
 * Get input classes
 */
export function getInputClasses(variant: keyof typeof INPUT_VARIANTS = 'default', className?: string): string {
  return cn(INPUT_VARIANTS[variant], className);
}

/**
 * Get badge classes
 */
export function getBadgeClasses(variant: keyof typeof BADGE_VARIANTS = 'default', className?: string): string {
  return cn(BADGE_VARIANTS[variant], className);
}