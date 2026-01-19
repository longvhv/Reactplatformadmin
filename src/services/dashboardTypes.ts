/**
 * Dashboard Shared Types
 */

export interface DashboardOverview {
  // Users & Tenants
  total_users: number;
  total_tenants: number;
  users_growth_percent: number;
  tenants_growth_percent: number;
  
  // Subscriptions
  active_subscriptions: number;
  expiring_subscriptions: number;
  total_subscription_orders: number;
  
  // Revenue (from invoices)
  monthly_revenue: number;
  total_revenue: number;
  revenue_growth_percent: number;
  pending_invoice_count: number;
  
  // Webhooks
  active_webhooks: number;
  unhealthy_webhooks: number;
  total_webhook_deliveries: number;
  
  // API Usage
  api_calls_today: number;
  api_calls_month: number;
  api_errors_today: number;
  
  // Traffic
  traffic_today: number;
  traffic_month: number;
  unique_visitors_today: number;
  
  // System Jobs
  total_jobs: number;
  active_jobs: number;
  failed_jobs: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ChartData {
  revenue: TimeSeriesData[];
  users: TimeSeriesData[];
  api_calls: TimeSeriesData[];
  traffic: TimeSeriesData[];
}

export interface RecentActivity {
  id: string;
  type: 'user' | 'subscription' | 'webhook' | 'api' | 'invoice' | 'audit';
  description: string;
  timestamp: string;
  user_name?: string;
  tenant_name?: string;
}

export interface AuditLog {
  _id: string;
  tenant_id?: string;
  user_id?: string;
  impersonator_id?: string;
  event_time: string;
  action?: string;
  resource?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  status?: string;
}
