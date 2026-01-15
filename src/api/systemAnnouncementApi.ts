/**
 * System Announcement API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface SystemAnnouncement {
  _id: string;
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE';
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateSystemAnnouncementRequest {
  title: string;
  content: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSystemAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: 'INFO' | 'WARNING' | 'CRITICAL';
  status?: 'ACTIVE' | 'INACTIVE';
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
  version: number;
}

export interface SystemAnnouncementFilters extends BaseFilters {
  priority?: string;
  status?: string;
}

const adapter = createAdapter<SystemAnnouncement, CreateSystemAnnouncementRequest, UpdateSystemAnnouncementRequest>(
  'system_announcements',
  '/system-announcements'
);

export const systemAnnouncementApi = {
  getAll: (filters?: SystemAnnouncementFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateSystemAnnouncementRequest) => adapter.create(data),
  update: (id: string, data: UpdateSystemAnnouncementRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default systemAnnouncementApi;
