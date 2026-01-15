/**
 * useLegalDocuments Hook
 * React hook for managing legal documents
 */

import { useState, useEffect, useCallback } from 'react';
import {
  legalDocumentsApi,
  LegalDocument,
  LegalDocumentFilters,
  CreateLegalDocumentData,
  UpdateLegalDocumentData,
} from '../api/legalDocumentsApi';

export function useLegalDocuments(filters?: LegalDocumentFilters) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await legalDocumentsApi.getAll(filters);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      console.error('Error fetching legal documents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create document
  const createDocument = async (data: CreateLegalDocumentData): Promise<LegalDocument> => {
    try {
      const created = await legalDocumentsApi.create(data);
      await fetchDocuments();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create document';
      setError(message);
      throw new Error(message);
    }
  };

  // Update document
  const updateDocument = async (id: string, data: UpdateLegalDocumentData): Promise<LegalDocument> => {
    try {
      const updated = await legalDocumentsApi.update(id, data);
      await fetchDocuments();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete document
  const deleteDocument = async (id: string): Promise<void> => {
    try {
      await legalDocumentsApi.delete(id);
      await fetchDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      setError(message);
      throw new Error(message);
    }
  };

  // Publish document
  const publishDocument = async (id: string, publishedBy: string): Promise<LegalDocument> => {
    try {
      const published = await legalDocumentsApi.publish(id, publishedBy);
      await fetchDocuments();
      return published;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish document';
      setError(message);
      throw new Error(message);
    }
  };

  // Archive document
  const archiveDocument = async (id: string, archivedBy: string): Promise<LegalDocument> => {
    try {
      const archived = await legalDocumentsApi.archive(id, archivedBy);
      await fetchDocuments();
      return archived;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive document';
      setError(message);
      throw new Error(message);
    }
  };

  // Increment view count
  const incrementViewCount = async (id: string): Promise<void> => {
    try {
      await legalDocumentsApi.incrementViewCount(id);
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  // Increment accept count
  const incrementAcceptCount = async (id: string): Promise<void> => {
    try {
      await legalDocumentsApi.incrementAcceptCount(id);
    } catch (err) {
      console.error('Error incrementing accept count:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    publishDocument,
    archiveDocument,
    incrementViewCount,
    incrementAcceptCount,
    refresh: fetchDocuments,
  };
}

export default useLegalDocuments;
