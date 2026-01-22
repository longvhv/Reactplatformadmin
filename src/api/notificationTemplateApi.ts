/**
 * Notification Template API Client
 * CRUD operations for notification templates
 * 
 * 🔴 REFACTORED 2026-01-20: 100% database alignment
 * Database: notification_templates
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type NotificationType = 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
export type TemplateStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type TemplatePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationTemplate {
  // I. IDENTITY & HIERARCHY
  _id: string;
  tenant_id: string; // uuid NOT NULL
  parent_template_id?: string; // uuid

  // II. BASIC CONTENT
  template_code: string; // varchar NOT NULL UNIQUE
  template_name: string; // varchar NOT NULL
  description?: string; // text
  subject?: string; // varchar
  body_text?: string; // text
  body_html?: string; // text

  // III. CLASSIFICATION
  notification_type: NotificationType; // varchar DEFAULT 'email'
  category?: string; // varchar
  priority: TemplatePriority; // varchar DEFAULT 'normal'
  language_code: string; // varchar DEFAULT 'vi'
  tags?: string[]; // ARRAY

  // IV. CONFIGURATION
  variables: any; // jsonb DEFAULT '[]'
  sample_data?: any; // jsonb
  delivery_channels: string[]; // ARRAY DEFAULT ['email']
  send_immediately: boolean; // boolean DEFAULT true
  scheduled_send_time?: string; // time without time zone
  attachments?: any; // jsonb
  headers?: any; // jsonb
  metadata?: Record<string, any>; // jsonb

  // V. STATUS & PERMISSIONS
  status: TemplateStatus; // varchar DEFAULT 'active'
  is_system_template: boolean; // boolean DEFAULT false
  is_editable: boolean; // boolean DEFAULT true

  // VI. STATISTICS
  usage_count: number; // integer DEFAULT 0
  last_used_at?: string; // timestamp with time zone
  success_count: number; // integer DEFAULT 0
  failure_count: number; // integer DEFAULT 0

  // VII. AUDIT TRAIL
  created_at: string; // timestamp with time zone DEFAULT now()
  created_by?: string; // varchar
  updated_at: string; // timestamp with time zone DEFAULT now()
  updated_by?: string; // varchar
  deleted_at?: string; // timestamp with time zone
  deleted_by?: string; // varchar
  version: number; // integer DEFAULT 1
}

// ==================== REQUEST INTERFACES ====================

export interface CreateTemplateRequest {
  // Required
  tenant_id: string;
  template_code: string;
  template_name: string;

  // Optional with defaults
  notification_type?: NotificationType; // default 'email'
  priority?: TemplatePriority; // default 'normal'
  language_code?: string; // default 'vi'
  variables?: any; // default '[]'
  delivery_channels?: string[]; // default ['email']
  send_immediately?: boolean; // default true
  status?: TemplateStatus; // default 'active'
  is_system_template?: boolean; // default false
  is_editable?: boolean; // default true
  usage_count?: number; // default 0
  success_count?: number; // default 0
  failure_count?: number; // default 0
  version?: number; // default 1

  // Optional
  parent_template_id?: string;
  description?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  category?: string;
  sample_data?: any;
  scheduled_send_time?: string;
  attachments?: any;
  headers?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  created_by?: string;
}

export interface UpdateTemplateRequest {
  tenant_id?: string; // Usually not updated, but included in schema
  template_code?: string; // Usually not updated
  template_name?: string;
  description?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  notification_type?: NotificationType;
  category?: string;
  priority?: TemplatePriority;
  language_code?: string;
  variables?: any;
  sample_data?: any;
  delivery_channels?: string[];
  send_immediately?: boolean;
  scheduled_send_time?: string;
  status?: TemplateStatus;
  is_system_template?: boolean;
  is_editable?: boolean;
  usage_count?: number;
  last_used_at?: string;
  success_count?: number;
  failure_count?: number;
  parent_template_id?: string;
  attachments?: any;
  headers?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  updated_by?: string;
  
  // For soft delete
  deleted_at?: string | null;
  deleted_by?: string | null;

  // Optimistic Locking
  version?: number;
}

export interface TemplateFilters extends BaseFilters {
  tenant_id?: string;
  notification_type?: string;
  status?: string;
  category?: string;
  language_code?: string;
  search?: string;
  include_deleted?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<NotificationTemplate, CreateTemplateRequest, UpdateTemplateRequest>(
  'notification_templates',
  '/notification-templates',
  { supportsSoftDelete: true }
);

// ==================== API CLIENT ====================

export const notificationTemplateApi = {
  /**
   * GET /notification-templates
   */
  getAll: async (filters?: TemplateFilters): Promise<NotificationTemplate[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.notification_type) query = query.eq('notification_type', filters.notification_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.language_code) query = query.eq('language_code', filters.language_code);
    
    // Search by multiple fields
    if (filters?.search) {
      query = query.or(`template_code.ilike.%${filters.search}%,template_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
    return data || [];
  },

  /**
   * GET /notification-templates/:id
   */
  getById: (id: string) => adapter.getById(id),

  /**
   * POST /notification-templates
   */
  create: async (data: CreateTemplateRequest): Promise<NotificationTemplate> => {
    // Apply defaults
    const requestData = {
      notification_type: 'email' as NotificationType,
      priority: 'normal' as TemplatePriority,
      language_code: 'vi',
      variables: [],
      delivery_channels: ['email'],
      send_immediately: true,
      status: 'active' as TemplateStatus,
      is_system_template: false,
      is_editable: true,
      usage_count: 0,
      success_count: 0,
      failure_count: 0,
      version: 1,
      ...data,
    };
    return adapter.create(requestData);
  },

  /**
   * PUT /notification-templates/:id
   */
  update: (id: string, data: UpdateTemplateRequest) => adapter.update(id, data),

  /**
   * DELETE /notification-templates/:id
   * Soft delete with deleted_by tracking
   */
  delete: async (id: string, deletedBy?: string): Promise<void> => {
    await adapter.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy || null,
      status: 'archived', // Or 'inactive'
    } as UpdateTemplateRequest);
  },
};

export default notificationTemplateApi;
