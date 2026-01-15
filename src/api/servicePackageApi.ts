/**
 * Service Package API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface ServicePackage {
  _id: string;
  tenant_id: string;
  product_id: string;
  code: string;
  name: string;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  currency: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateServicePackageRequest {
  tenant_id: string;
  product_id: string;
  code: string;
  name: string;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface UpdateServicePackageRequest {
  name?: string;
  billing_cycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price?: number;
  currency?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  version: number;
}

export interface ServicePackageFilters extends BaseFilters {
  tenant_id?: string;
  product_id?: string;
  billing_cycle?: string;
  is_active?: boolean;
}

const adapter = createAdapter<ServicePackage, CreateServicePackageRequest, UpdateServicePackageRequest>(
  'service_packages',
  '/service-packages'
);

export const servicePackageApi = {
  getAll: (filters?: ServicePackageFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateServicePackageRequest) => adapter.create(data),
  update: (id: string, data: UpdateServicePackageRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default servicePackageApi;
