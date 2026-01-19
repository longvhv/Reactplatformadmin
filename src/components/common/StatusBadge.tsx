import React from 'react';
import { Badge } from '../ui/badge';
import { LucideIcon } from 'lucide-react';

export interface StatusConfig {
  label: string;
  color?: string; // Tailwind classes string (e.g. "bg-green-100 text-green-800")
  icon?: LucideIcon;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

interface StatusBadgeProps {
  status: string;
  config?: Record<string, StatusConfig>; // Optional: if provided, uses map. If not, tries to use status as label.
  className?: string;
  showIcon?: boolean;
}

/**
 * Generic Status Badge Component
 * Reduces duplication of status badge logic across pages
 */
export function StatusBadge({ status, config, className = '', showIcon = true }: StatusBadgeProps) {
  if (!status) return null;

  // If config is provided, look it up
  const statusConfig = config ? config[status] : null;

  // Fallback defaults if no config match
  const label = statusConfig?.label || status;
  const colorClass = statusConfig?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  const Icon = statusConfig?.icon;
  const variant = statusConfig?.variant || 'secondary';

  // If using variant-based Badge from shadcn
  if (config && statusConfig?.variant) {
    return (
      <Badge variant={statusConfig.variant} className={`${className} flex items-center gap-1 w-fit`}>
        {showIcon && Icon && <Icon className="w-3 h-3" />}
        {label}
      </Badge>
    );
  }

  // Default custom styled badge
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className} gap-1`}>
      {showIcon && Icon && <Icon className="w-3 h-3" />}
      {label}
    </div>
  );
}
