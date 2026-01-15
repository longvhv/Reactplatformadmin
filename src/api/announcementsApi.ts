/**
 * Announcements API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface Announcement {
  _id: string;
  tenant_id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  start_date: string;
  end_date?: string;
  target_audience?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateAnnouncementRequest {
  tenant_id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  start_date: string;
  end_date?: string;
  target_audience?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  start_date?: string;
  end_date?: string;
  target_audience?: string[];
  metadata?: Record<string, any>;
  version: number;
}

export interface AnnouncementFilters extends BaseFilters {
  tenant_id?: string;
  priority?: string;
  status?: string;
}

const adapter = createAdapter<Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest>(
  'announcements',
  '/announcements'
);

export const announcementsApi = {
  getAll: (filters?: AnnouncementFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateAnnouncementRequest) => adapter.create(data),
  update: (id: string, data: UpdateAnnouncementRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default announcementsApi;
