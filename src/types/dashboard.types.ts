/**
 * Dashboard Types
 * Type definitions for dashboard components
 * Extracted from deprecated /services/dashboardApi.ts
 */

export interface DashboardStat {
  id: number;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  bgColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardActivity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'user' | 'system' | 'alert' | 'update';
  createdAt: string;
  updatedAt: string;
}

// Legacy type aliases for backward compatibility
export type Stat = DashboardStat;
export type Activity = DashboardActivity;
