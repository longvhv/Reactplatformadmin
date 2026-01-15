/**
 * User Consents API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface UserConsent {
  _id: string;
  user_id: string;
  consent_type: 'TERMS' | 'PRIVACY' | 'MARKETING' | 'COOKIES' | 'DATA_PROCESSING';
  consent_version: string;
  is_granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateConsentRequest {
  user_id: string;
  consent_type: 'TERMS' | 'PRIVACY' | 'MARKETING' | 'COOKIES' | 'DATA_PROCESSING';
  consent_version: string;
  is_granted: boolean;
  granted_at?: string;
  metadata?: Record<string, any>;
}

export interface ConsentFilters extends BaseFilters {
  user_id?: string;
  consent_type?: string;
  is_granted?: boolean;
}

const adapter = createAdapter<UserConsent, CreateConsentRequest, any>(
  'user_consents',
  '/user-consents'
);

export const userConsentsApi = {
  getAll: (filters?: ConsentFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateConsentRequest) => adapter.create(data),
  delete: (id: string) => adapter.delete(id),
};

export default userConsentsApi;
