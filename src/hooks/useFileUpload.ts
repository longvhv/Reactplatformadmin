/**
 * useFileUpload Hook
 * Manages file uploads and storage
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * Schema:
 * - storage_files: storage_path, public_url, storage_provider, status
 * 
 * NOTE: Supports folders (is_folder, parent_id)
 * Integrates with S3/R2/MinIO/Cloudflare storage
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Storage File type (from storage_files table)
 */
export interface StorageFile {
  _id: string;
  tenant_id: string;
  parent_id?: string;
  is_folder: boolean;
  original_name: string;
  storage_path?: string;
  public_url?: string;
  category: 'MEDIA' | 'DOCUMENT' | 'ARCHIVE' | 'EXPORT' | 'SYSTEM';
  mime_type: string;
  extension?: string;
  file_size: number;
  items_snapshot?: any;
  metadata?: any;
  storage_provider: 'S3' | 'R2' | 'MINIO' | 'CLOUDFLARE';
  visibility: 'PRIVATE' | 'PUBLIC';
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

/**
 * File filters
 */
export interface FileFilters {
  parent_id?: string; // Filter by folder
  category?: StorageFile['category'];
  status?: StorageFile['status'];
  is_folder?: boolean;
  mime_type?: string; // e.g., 'image/*', 'application/pdf'
}

/**
 * Upload options
 */
export interface UploadOptions {
  parent_id?: string;
  category?: StorageFile['category'];
  visibility?: StorageFile['visibility'];
  metadata?: any;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Hook for file upload and storage management
 * @param tenantId - The ID of the tenant
 * @param filters - Optional filters
 */
export function useFileUpload(tenantId?: string, filters?: FileFilters) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load files
   */
  const loadFiles = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setFiles([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useFileUpload] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useFileUpload] Loading files for tenant:', tenantId);

      // Try cache first
      const cacheKey = `files_${tenantId}_${filters?.parent_id || 'root'}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 2 minutes old
        if (cacheAge < 2 * 60 * 1000) {
          setFiles(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      setError(message);
      console.error('[useFileUpload] Error loading files:', err);
      setLoading(false);
    }
  }, [tenantId, filters, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build filters
      const queryFilters: Record<string, any> = {
        tenant_id: tenantId,
      };

      // Filter by parent (null for root)
      if (filters?.parent_id !== undefined) {
        queryFilters.parent_id = filters.parent_id;
      }

      if (filters?.category) queryFilters.category = filters.category;
      if (filters?.status) queryFilters.status = filters.status;
      if (filters?.is_folder !== undefined) queryFilters.is_folder = filters.is_folder;
      if (filters?.mime_type) queryFilters.mime_type = filters.mime_type;

      // Query using DataClient
      const result = await dataClient.query<StorageFile>('storage_files', {
        filters: queryFilters,
        orderBy: [
          { field: 'is_folder', direction: 'desc' }, // Folders first
          { field: 'created_at', direction: 'desc' },
        ],
      });

      console.log('[useFileUpload] Loaded files:', result.data.length);

      // Update cache
      const cacheKey = `files_${tenantId}_${filters?.parent_id || 'root'}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setFiles(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useFileUpload] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Upload file
   * 
   * TODO: In production, this should use signed upload URLs from backend
   */
  const uploadFile = useCallback(
    async (
      file: File,
      options: UploadOptions = {},
      onProgress?: UploadProgressCallback
    ): Promise<StorageFile> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useFileUpload] Uploading file:', file.name);

        // Create file record
        const fileRecord = await dataClient.create<StorageFile>('storage_files', {
          tenant_id: tenantId,
          parent_id: options.parent_id,
          is_folder: false,
          original_name: file.name,
          category: options.category || 'MEDIA',
          mime_type: file.type || 'application/octet-stream',
          extension: getFileExtension(file.name),
          file_size: file.size,
          storage_provider: 'S3',
          visibility: options.visibility || 'PRIVATE',
          status: 'UPLOADING',
          metadata: options.metadata,
          version: 1,
        });

        console.log('[useFileUpload] File record created:', fileRecord._id);

        // TODO: Upload to storage (S3/R2/etc)
        // For now, we simulate upload progress
        const uploadId = fileRecord._id;
        
        setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setUploadProgress((prev) => ({ ...prev, [uploadId]: progress }));
          if (onProgress) onProgress(progress);
        }

        // Update file record with storage info
        const uploadedFile = await dataClient.update<StorageFile>(
          'storage_files',
          fileRecord._id,
          {
            status: 'READY',
            storage_path: `/uploads/${tenantId}/${fileRecord._id}/${file.name}`,
            public_url: options.visibility === 'PUBLIC' 
              ? `https://cdn.example.com/uploads/${tenantId}/${fileRecord._id}/${file.name}`
              : undefined,
          }
        );

        console.log('[useFileUpload] File uploaded:', uploadedFile._id);

        // Clean up progress
        setUploadProgress((prev) => {
          const { [uploadId]: _, ...rest } = prev;
          return rest;
        });

        // Optimistic update
        setFiles((prev) => [uploadedFile, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`files_${tenantId}_${options.parent_id || 'root'}`);

        return uploadedFile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file';
        setError(message);
        console.error('[useFileUpload] Error uploading file:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Create folder
   */
  const createFolder = useCallback(
    async (name: string, parentId?: string): Promise<StorageFile> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useFileUpload] Creating folder:', name);

        const folder = await dataClient.create<StorageFile>('storage_files', {
          tenant_id: tenantId,
          parent_id: parentId,
          is_folder: true,
          original_name: name,
          category: 'MEDIA',
          mime_type: 'application/x-directory',
          file_size: 0,
          storage_provider: 'S3',
          visibility: 'PRIVATE',
          status: 'READY',
          version: 1,
        });

        console.log('[useFileUpload] Folder created:', folder._id);

        // Optimistic update
        setFiles((prev) => [folder, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`files_${tenantId}_${parentId || 'root'}`);

        return folder;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create folder';
        setError(message);
        console.error('[useFileUpload] Error creating folder:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Delete file or folder
   */
  const deleteFile = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useFileUpload] Deleting file:', id);

        // TODO: Delete from storage (S3/R2/etc) first
        
        await dataClient.delete('storage_files', id);

        console.log('[useFileUpload] File deleted');

        // Optimistic update
        setFiles((prev) => prev.filter((f) => f._id !== id));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`files_${tenantId}_${filters?.parent_id || 'root'}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete file';
        setError(message);
        console.error('[useFileUpload] Error deleting file:', err);
        throw new Error(message);
      }
    },
    [tenantId, filters, dataClient]
  );

  /**
   * Rename file or folder
   */
  const renameFile = useCallback(
    async (id: string, newName: string): Promise<StorageFile> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useFileUpload] Renaming file:', id);

        const updatedFile = await dataClient.update<StorageFile>('storage_files', id, {
          original_name: newName,
          extension: getFileExtension(newName),
        });

        console.log('[useFileUpload] File renamed');

        // Optimistic update
        setFiles((prev) => prev.map((f) => (f._id === id ? updatedFile : f)));

        return updatedFile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to rename file';
        setError(message);
        console.error('[useFileUpload] Error renaming file:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Move file to different folder
   */
  const moveFile = useCallback(
    async (id: string, newParentId?: string): Promise<StorageFile> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useFileUpload] Moving file:', id);

        const movedFile = await dataClient.update<StorageFile>('storage_files', id, {
          parent_id: newParentId,
        });

        console.log('[useFileUpload] File moved');

        // Optimistic update - remove from current list
        setFiles((prev) => prev.filter((f) => f._id !== id));

        // Invalidate both source and destination caches
        if (tenantId) {
          localStorage.removeItem(`files_${tenantId}_${filters?.parent_id || 'root'}`);
          localStorage.removeItem(`files_${tenantId}_${newParentId || 'root'}`);
        }

        return movedFile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to move file';
        setError(message);
        console.error('[useFileUpload] Error moving file:', err);
        throw new Error(message);
      }
    },
    [tenantId, filters, dataClient]
  );

  /**
   * Get file by ID
   */
  const getFile = useCallback(
    (id: string): StorageFile | undefined => {
      return files.find((f) => f._id === id);
    },
    [files]
  );

  /**
   * Get folders only
   */
  const getFolders = useCallback((): StorageFile[] => {
    return files.filter((f) => f.is_folder);
  }, [files]);

  /**
   * Get files only (no folders)
   */
  const getFilesOnly = useCallback((): StorageFile[] => {
    return files.filter((f) => !f.is_folder);
  }, [files]);

  /**
   * Get total storage used
   */
  const getTotalSize = useCallback((): number => {
    return files.reduce((sum, file) => sum + (file.file_size || 0), 0);
  }, [files]);

  /**
   * Reload files from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`files_${tenantId}_${filters?.parent_id || 'root'}`);
    }
    await loadFiles();
  }, [tenantId, filters, loadFiles]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useFileUpload] Auto-loading files for:', tenantId);
      loadFiles();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadFiles();
    }
  }, [
    filters?.parent_id,
    filters?.category,
    filters?.status,
    filters?.is_folder,
    filters?.mime_type,
  ]);

  return {
    files,
    uploadProgress,
    loading,
    error,
    total,
    loadFiles,
    uploadFile,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
    getFile,
    getFolders,
    getFilesOnly,
    getTotalSize,
    refresh,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}
