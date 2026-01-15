/**
 * StatusBadge Component
 * Standardized status badge for consistent UI
 */

import { BADGE_VARIANTS, cn } from '@/constants/ui';
import { CheckCircle, XCircle, Clock, AlertCircle, Ban, Users, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'destructive' | 'primary' | 'default' | 'outline';

export interface StatusBadgeProps {
  /**
   * Badge variant
   */
  variant?: StatusVariant;
  
  /**
   * Optional icon (auto-selected if not provided)
   */
  icon?: LucideIcon;
  
  /**
   * Badge label
   */
  children: React.ReactNode;
  
  /**
   * Additional classes
   */
  className?: string;
}

/**
 * Auto-select icon based on variant
 */
const getDefaultIcon = (variant: StatusVariant): LucideIcon => {
  const iconMap: Record<StatusVariant, LucideIcon> = {
    success: CheckCircle,
    warning: AlertCircle,
    destructive: XCircle,
    primary: Shield,
    default: Clock,
    outline: Users,
  };
  return iconMap[variant];
};

/**
 * StatusBadge - Consistent status indicator
 * 
 * @example
 * <StatusBadge variant="success">Active</StatusBadge>
 * <StatusBadge variant="warning">Pending</StatusBadge>
 * <StatusBadge variant="destructive">Banned</StatusBadge>
 */
export function StatusBadge({ 
  variant = 'default', 
  icon,
  children, 
  className 
}: StatusBadgeProps) {
  const Icon = icon || getDefaultIcon(variant);
  
  return (
    <span className={cn(BADGE_VARIANTS[variant], className)}>
      <Icon className="w-3 h-3" />
      {children}
    </span>
  );
}

/**
 * Common status badge presets
 */
export const StatusBadges = {
  Active: () => <StatusBadge variant="success">Active</StatusBadge>,
  Inactive: () => <StatusBadge variant="default">Inactive</StatusBadge>,
  Pending: () => <StatusBadge variant="warning">Pending</StatusBadge>,
  Banned: () => <StatusBadge variant="destructive">Banned</StatusBadge>,
  Disabled: () => <StatusBadge variant="outline">Disabled</StatusBadge>,
  Verified: () => <StatusBadge variant="success">Verified</StatusBadge>,
  Unverified: () => <StatusBadge variant="warning">Unverified</StatusBadge>,
  Admin: () => <StatusBadge variant="primary" icon={Shield}>Admin</StatusBadge>,
  User: () => <StatusBadge variant="outline" icon={Users}>User</StatusBadge>,
};
