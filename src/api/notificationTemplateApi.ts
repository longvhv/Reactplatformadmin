/**
 * Notification Template API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface NotificationTemplate {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  body: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateTemplateRequest {
  tenant_id: string;
  code: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  body?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  version: number;
}

export interface TemplateFilters extends BaseFilters {
  tenant_id?: string;
  channel?: string;
  is_active?: boolean;
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
