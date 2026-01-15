/**
 * Legal Documents API Client
 */
import { createAdapter, BaseFilters } from './adapters';

export type LegalDocumentType = 
  | 'terms_of_service' 
  | 'privacy_policy' 
  | 'cookie_policy' 
  | 'gdpr' 
  | 'eula' 
  | 'sla' 
  | 'dpa' 
  | 'other';

export type LegalDocumentStatus = 'draft' | 'published' | 'archived';

export interface LegalDocument {
  _id: string;
  tenant_id: string;
  code?: string;
  title: string;
  slug: string;
  type: LegalDocumentType;
  version: string;
  content: string;
  summary?: string;
  status: LegalDocumentStatus;
  is_active: boolean;
  effective_date?: string;
  expiry_date?: string;
  language?: string;
  view_count?: number;
  accept_count?: number;
  published_by?: string;
  published_at?: string;
  archived_by?: string;
  archived_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version_number?: number;
}

export interface CreateLegalDocumentData {
  tenant_id: string;
  title: string;
  slug: string;
  type: LegalDocumentType;
  version: string;
  content: string;
  summary?: string;
  status?: LegalDocumentStatus;
  effective_date?: string;
  expiry_date?: string;
  language?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateLegalDocumentData {
  title?: string;
  slug?: string;
  type?: LegalDocumentType;
  version?: string;
  content?: string;
  summary?: string;
  status?: LegalDocumentStatus;
  is_active?: boolean;
  effective_date?: string;
  expiry_date?: string;
  language?: string;
  metadata?: Record<string, any>;
  version_number?: number;
}

export interface LegalDocumentFilters extends BaseFilters {
  tenant_id?: string;
  type?: LegalDocumentType;
  status?: LegalDocumentStatus;
  is_active?: boolean;
  language?: string;
  search?: string;
}

const adapter = createAdapter<LegalDocument, CreateLegalDocumentData, UpdateLegalDocumentData>(
  'legal_documents',
  '/legal-documents'
);

export const legalDocumentsApi = {
  /**
   * GET /legal-documents
   */
  getAll: (filters?: LegalDocumentFilters) => adapter.getAll(filters),
  
  /**
   * GET /legal-documents/:id
   */
  getById: (id: string) => adapter.getById(id),
  
  /**
   * POST /legal-documents
   */
  create: (data: CreateLegalDocumentData) => adapter.create(data),
  
  /**
   * PUT /legal-documents/:id
   */
  update: (id: string, data: UpdateLegalDocumentData) => adapter.update(id, data),
  
  /**
   * DELETE /legal-documents/:id
   */
  delete: (id: string) => adapter.delete(id),
  
  /**
   * POST /legal-documents/:id/publish
   * Publish a document (change status to published)
   */
  publish: async (id: string, publishedBy: string): Promise<LegalDocument> => {
    return adapter.update(id, {
      status: 'published',
      metadata: { published_by: publishedBy, published_at: new Date().toISOString() },
    });
  },
  
  /**
   * POST /legal-documents/:id/archive
   * Archive a document (change status to archived)
   */
  archive: async (id: string, archivedBy: string): Promise<LegalDocument> => {
    return adapter.update(id, {
      status: 'archived',
      is_active: false,
      metadata: { archived_by: archivedBy, archived_at: new Date().toISOString() },
    });
  },
  
  /**
   * POST /legal-documents/:id/view
   * Increment view count
   */
  incrementViewCount: async (id: string): Promise<void> => {
    // This would typically call a specific endpoint
    // For now, we'll handle it client-side or via update
    // TODO: Implement proper endpoint when backend is ready
    console.log('Increment view count for document:', id);
  },
  
  /**
   * POST /legal-documents/:id/accept
   * Increment accept count
   */
  incrementAcceptCount: async (id: string): Promise<void> => {
    // This would typically call a specific endpoint
    // For now, we'll handle it client-side or via update
    // TODO: Implement proper endpoint when backend is ready
    console.log('Increment accept count for document:', id);
  },
};

export default legalDocumentsApi;