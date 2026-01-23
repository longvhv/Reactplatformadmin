package service

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type StorageFileService struct {
	storageRepo repository.StorageFileRepository
}

func NewStorageFileService(storageRepo repository.StorageFileRepository) *StorageFileService {
	return &StorageFileService{
		storageRepo: storageRepo,
	}
}

type UploadFileRequest struct {
	TenantID        uuid.UUID              `json:"tenant_id" binding:"required"`
	ParentID        *uuid.UUID             `json:"parent_id"`
	OriginalName    string                 `json:"original_name" binding:"required"`
	StoragePath     *string                `json:"storage_path"`
	PublicURL       *string                `json:"public_url"`
	Category        string                 `json:"category"`
	MimeType        string                 `json:"mime_type" binding:"required"`
	FileSize        int64                  `json:"file_size" binding:"required"`
	Metadata        map[string]interface{} `json:"metadata"`
	StorageProvider string                 `json:"storage_provider"`
	Visibility      string                 `json:"visibility"`
	UploadedBy      uuid.UUID              `json:"-"`
}

type CreateFolderRequest struct {
	TenantID     uuid.UUID              `json:"tenant_id" binding:"required"`
	ParentID     *uuid.UUID             `json:"parent_id"`
	FolderName   string                 `json:"folder_name" binding:"required"`
	Category     string                 `json:"category"`
	Metadata     map[string]interface{} `json:"metadata"`
	UploadedBy   uuid.UUID              `json:"-"`
}

type UpdateStorageFileRequest struct {
	OriginalName *string                `json:"original_name"`
	Category     *string                `json:"category"`
	Visibility   *string                `json:"visibility"`
	Status       *string                `json:"status"`
	Metadata     map[string]interface{} `json:"metadata"`
}

// GetByID gets file by ID
func (s *StorageFileService) GetByID(ctx context.Context, id uuid.UUID) (*models.StorageFile, error) {
	return s.storageRepo.GetByID(ctx, id)
}

// ListByTenant lists files by tenant
func (s *StorageFileService) ListByTenant(ctx context.Context, tenantID uuid.UUID, category string, parentID *uuid.UUID, page, limit int) ([]*models.StorageFile, int64, error) {
	offset := (page - 1) * limit
	return s.storageRepo.ListByTenant(ctx, tenantID, category, parentID, limit, offset)
}

// UploadFile uploads a file
func (s *StorageFileService) UploadFile(ctx context.Context, req UploadFileRequest) (*models.StorageFile, error) {
	// Extract extension from original name
	extension := strings.TrimPrefix(filepath.Ext(req.OriginalName), ".")

	category := req.Category
	if category == "" {
		category = s.detectCategory(req.MimeType)
	}

	storageProvider := req.StorageProvider
	if storageProvider == "" {
		storageProvider = "S3"
	}

	visibility := req.Visibility
	if visibility == "" {
		visibility = "PRIVATE"
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	file := &models.StorageFile{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		ParentID:        req.ParentID,
		IsFolder:        false,
		OriginalName:    req.OriginalName,
		StoragePath:     req.StoragePath,
		PublicURL:       req.PublicURL,
		Category:        category,
		MimeType:        req.MimeType,
		Extension:       &extension,
		FileSize:        req.FileSize,
		ItemsSnapshot:   []interface{}{},
		Metadata:        metadata,
		StorageProvider: storageProvider,
		Visibility:      visibility,
		Status:          "UPLOADING",
		UploadedBy:      &req.UploadedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	if err := s.storageRepo.Create(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// TODO: Upload to actual storage provider (S3, R2, MinIO, etc.)
	// After upload completes, update status to READY
	file.Status = "READY"
	_ = s.storageRepo.Update(ctx, file)

	return file, nil
}

// CreateFolder creates a folder
func (s *StorageFileService) CreateFolder(ctx context.Context, req CreateFolderRequest) (*models.StorageFile, error) {
	category := req.Category
	if category == "" {
		category = "MEDIA"
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	folder := &models.StorageFile{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		ParentID:        req.ParentID,
		IsFolder:        true,
		OriginalName:    req.FolderName,
		Category:        category,
		MimeType:        "application/x-directory",
		FileSize:        0,
		ItemsSnapshot:   []interface{}{},
		Metadata:        metadata,
		StorageProvider: "S3",
		Visibility:      "PRIVATE",
		Status:          "READY",
		UploadedBy:      &req.UploadedBy,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	if err := s.storageRepo.Create(ctx, folder); err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	return folder, nil
}

// UpdateFile updates a file
func (s *StorageFileService) UpdateFile(ctx context.Context, id uuid.UUID, req UpdateStorageFileRequest) (*models.StorageFile, error) {
	file, err := s.storageRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if req.OriginalName != nil {
		file.OriginalName = *req.OriginalName
	}
	if req.Category != nil {
		file.Category = *req.Category
	}
	if req.Visibility != nil {
		file.Visibility = *req.Visibility
	}
	if req.Status != nil {
		file.Status = *req.Status
	}
	if req.Metadata != nil {
		file.Metadata = req.Metadata
	}

	file.UpdatedAt = time.Now()
	file.Version++

	if err := s.storageRepo.Update(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to update file: %w", err)
	}

	return file, nil
}

// DeleteFile deletes a file
func (s *StorageFileService) DeleteFile(ctx context.Context, id uuid.UUID) error {
	file, err := s.storageRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	// If folder, check if it has children
	if file.IsFolder {
		hasChildren, err := s.storageRepo.HasChildren(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to check children: %w", err)
		}
		if hasChildren {
			return fmt.Errorf("cannot delete folder with children")
		}
	}

	if err := s.storageRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	// TODO: Delete from actual storage provider

	return nil
}

// MoveFile moves a file to another folder
func (s *StorageFileService) MoveFile(ctx context.Context, id uuid.UUID, newParentID *uuid.UUID) (*models.StorageFile, error) {
	file, err := s.storageRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	// Validate new parent exists and is a folder
	if newParentID != nil {
		parent, err := s.storageRepo.GetByID(ctx, *newParentID)
		if err != nil {
			return nil, fmt.Errorf("parent folder not found: %w", err)
		}
		if !parent.IsFolder {
			return nil, fmt.Errorf("parent must be a folder")
		}
		if parent.TenantID != file.TenantID {
			return nil, fmt.Errorf("cannot move file to different tenant")
		}
	}

	file.ParentID = newParentID
	file.UpdatedAt = time.Now()
	file.Version++

	if err := s.storageRepo.Update(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to move file: %w", err)
	}

	return file, nil
}

// GetPublicURL gets public URL for a file
func (s *StorageFileService) GetPublicURL(ctx context.Context, id uuid.UUID) (string, error) {
	file, err := s.storageRepo.GetByID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("file not found: %w", err)
	}

	if file.IsFolder {
		return "", fmt.Errorf("cannot get public URL for folder")
	}

	if file.PublicURL != nil && *file.PublicURL != "" {
		return *file.PublicURL, nil
	}

	// TODO: Generate signed URL from storage provider
	publicURL := fmt.Sprintf("https://storage.example.com/%s/%s", file.TenantID.String(), file.ID.String())

	file.PublicURL = &publicURL
	file.UpdatedAt = time.Now()

	_ = s.storageRepo.Update(ctx, file)

	return publicURL, nil
}

// Helper functions
func (s *StorageFileService) detectCategory(mimeType string) string {
	if strings.HasPrefix(mimeType, "image/") || strings.HasPrefix(mimeType, "video/") || strings.HasPrefix(mimeType, "audio/") {
		return "MEDIA"
	}
	if strings.HasPrefix(mimeType, "application/pdf") || strings.Contains(mimeType, "document") || strings.Contains(mimeType, "text") {
		return "DOCUMENT"
	}
	if strings.Contains(mimeType, "zip") || strings.Contains(mimeType, "compressed") {
		return "ARCHIVE"
	}
	return "MEDIA"
}
