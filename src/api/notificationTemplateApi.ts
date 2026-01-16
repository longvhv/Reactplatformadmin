/**
 * Notification Template API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface NotificationTemplate {
  _id: string;
  tenant_id: string;
  template_code: string;
  template_name: string;
  description?: string;
  subject?: string;
  body_text?: string;                // ✅ FIXED: Changed from required to optional (DB is nullable)
  body_html?: string;
  notification_type: 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  language_code?: string;
  variables?: any;
  sample_data?: any;
  delivery_channels?: string[];
  send_immediately?: boolean;
  scheduled_send_time?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  is_system_template?: boolean;
  is_editable?: boolean;
  usage_count?: number;
  last_used_at?: string;
  success_count?: number;
  failure_count?: number;
  version: number;
  parent_template_id?: string;
  attachments?: any;
  headers?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface CreateTemplateRequest {
  tenant_id: string;
  template_code: string;
  template_name: string;
  description?: string;
  subject?: string;
  body_text?: string;                // ✅ FIXED: Optional to match database
  body_html?: string;
  notification_type: 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  language_code?: string;
  delivery_channels?: string[];
  send_immediately?: boolean;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  is_system_template?: boolean;
  is_editable?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  // ✅ ADDED: Missing fields from audit
  variables?: any;
  sample_data?: any;
  scheduled_send_time?: string;
  attachments?: any;
  headers?: any;
  parent_template_id?: string;
}

export interface UpdateTemplateRequest {
  template_name?: string;
  description?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  notification_type?: 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  is_system_template?: boolean;
  is_editable?: boolean;
  metadata?: Record<string, any>;
  version: number;
  // ✅ ADDED: Missing fields from audit
  delivery_channels?: string[];
  send_immediately?: boolean;
  scheduled_send_time?: string;
  language_code?: string;
  tags?: string[];
  variables?: any;
  sample_data?: any;
  attachments?: any;
  headers?: any;
}

export interface TemplateFilters extends BaseFilters {
  tenant_id?: string;
  notification_type?: string;
  status?: string;
}

const adapter = createAdapter<NotificationTemplate, CreateTemplateRequest, UpdateTemplateRequest>(
  'notification_templates',
  '/notification-templates'
);

export const notificationTemplateApi = {
  getAll: (filters?: TemplateFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateTemplateRequest) => adapter.create(data),
  update: (id: string, data: UpdateTemplateRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default notificationTemplateApi;