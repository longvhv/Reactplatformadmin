/**
 * SaaS Product API Client
 * Aligned with database schema in docs/DatabaseCommand.md
 */
import { createAdapter, BaseFilters } from './adapters';

export type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';

export interface SaaSProduct {
  _id?: string;
  code: string;
  name: string;
  product_type: ProductType;
  description?: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  version?: number;
}

export interface CreateSaaSProductRequest {
  code: string;
  name: string;
  product_type: ProductType;
  description?: string;
  base_price?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSaaSProductRequest {
  name?: string;
  product_type?: ProductType;
  description?: string;
  base_price?: number;
  currency?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  version: number;
}

export interface ProductFilters extends BaseFilters {
  product_type?: ProductType;
  is_active?: boolean;
}

const adapter = createAdapter<SaaSProduct, CreateSaaSProductRequest, UpdateSaaSProductRequest>(
  'saas_products',
  '/saas-products'
);

export const saasProductApi = {
  getAll: (filters?: ProductFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateSaaSProductRequest) => adapter.create(data),
  update: (id: string, data: UpdateSaaSProductRequest) => adapter.update(id, data),
  softDelete: (id: string) => adapter.delete(id),
};

export default saasProductApi;