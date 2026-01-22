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
  
  // ✅ FIXED 2026-01-15: Audit fields compliance
  created_by?: string;            // FK to users(_id)
  updated_by?: string;            // FK to users(_id)
  
  // ✅ FIXED 2026-01-15: Publishing tracking (moved from metadata)
  published_by?: string;          // FK to users(_id)
  published_at?: string;          // TIMESTAMPTZ
  
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
  
  // ✅ FIXED 2026-01-15: Audit compliance
  created_by?: string;            // User who creates the document
  published_by?: string;          // User who publishes (if status is published)
  published_at?: string;          // Publish timestamp (if status is published)
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
  
  // ✅ FIXED 2026-01-15: Audit and publishing compliance
  updated_by?: string;            // User who updates the document
  published_by?: string;          // User who publishes (moved from metadata)
  published_at?: string;          // Publish timestamp (moved from metadata)
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
   * ✅ FIXED 2026-01-15: Use dedicated columns instead of metadata
   */
  publish: async (id: string, publishedBy: string): Promise<LegalDocument> => {
    return adapter.update(id, {
      status: 'published',
      published_by: publishedBy,              // ✅ Dedicated column (not metadata)
      published_at: new Date().toISOString(), // ✅ Dedicated column (not metadata)
    });
  },
  
  /**
   * POST /legal-documents/:id/archive
   * Archive a document (change status to archived)
   * ⚠️ NOTE: archived_by/archived_at stored in metadata until DB schema adds dedicated columns
   */
  archive: async (id: string, archivedBy: string): Promise<LegalDocument> => {
    return adapter.update(id, {
      status: 'archived',
      is_active: false,
      // ⚠️ Using metadata because archived_by/archived_at columns don't exist in DB yet
      // TODO: When DB adds these columns, move to dedicated fields like published_by/published_at
      metadata: { 
        archived_by: archivedBy, 
        archived_at: new Date().toISOString() 
      },
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