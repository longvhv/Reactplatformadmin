/**
 * Legal Documents API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export interface LegalDocument {
  _id: string;
  code: string;
  title: string;
  doc_type: 'TERMS' | 'PRIVACY' | 'GDPR' | 'EULA' | 'SLA';
  version: string;
  content: string;
  is_active: boolean;
  effective_date: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version_number: number;
}

export interface CreateDocumentRequest {
  code: string;
  title: string;
  doc_type: 'TERMS' | 'PRIVACY' | 'GDPR' | 'EULA' | 'SLA';
  version: string;
  content: string;
  effective_date: string;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  is_active?: boolean;
  effective_date?: string;
  metadata?: Record<string, any>;
  version_number: number;
}

export interface DocumentFilters extends BaseFilters {
  doc_type?: string;
  is_active?: boolean;
}

const adapter = createAdapter<LegalDocument, CreateDocumentRequest, UpdateDocumentRequest>(
  'legal_documents',
  '/legal-documents'
);

export const legalDocumentsApi = {
  getAll: (filters?: DocumentFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateDocumentRequest) => adapter.create(data),
  update: (id: string, data: UpdateDocumentRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
};

export default legalDocumentsApi;
