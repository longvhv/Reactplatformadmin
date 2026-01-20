package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type StorageFileService interface {
	CreateFile(ctx context.Context, req *models.CreateStorageFileRequest) (*models.StorageFile, error)
	GetFile(ctx context.Context, id uuid.UUID) (*models.StorageFile, error)
	ListFiles(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, category, status *string, isFolder *bool) ([]*models.StorageFile, int, error)
	ListFilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error)
	ListFilesByParent(ctx context.Context, parentID uuid.UUID) ([]*models.StorageFile, error)
	ListFilesByCategory(ctx context.Context, category string) ([]*models.StorageFile, error)
	ListFolders(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error)
	UpdateFile(ctx context.Context, id uuid.UUID, req *models.UpdateStorageFileRequest) (*models.StorageFile, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	DeleteFile(ctx context.Context, id uuid.UUID) error
	SoftDeleteFile(ctx context.Context, id uuid.UUID) error
	GetTotalSize(ctx context.Context, tenantID uuid.UUID) (int64, error)
}

type storageFileService struct {
	repo repository.StorageFileRepository
}

func NewStorageFileService(repo repository.StorageFileRepository) StorageFileService {
	return &storageFileService{repo: repo}
}

func (s *storageFileService) CreateFile(ctx context.Context, req *models.CreateStorageFileRequest) (*models.StorageFile, error) {
	now := time.Now()
	file := &models.StorageFile{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		IsFolder:        req.IsFolder,
		OriginalName:    req.OriginalName,
		Category:        req.Category,
		MimeType:        req.MimeType,
		FileSize:        req.FileSize,
		StorageProvider: "S3",
		Visibility:      "PRIVATE",
		Status:          "PROCESSING",
		CreatedAt:       now,
		UpdatedAt:       now,
		Version:         1,
	}

	if req.ParentID != nil {
		file.ParentID.String = req.ParentID.String()
		file.ParentID.Valid = true
	}

	if req.StoragePath != "" {
		file.StoragePath.String = req.StoragePath
		file.StoragePath.Valid = true
	}

	if req.PublicURL != "" {
		file.PublicURL.String = req.PublicURL
		file.PublicURL.Valid = true
	}

	if req.Extension != "" {
		file.Extension.String = req.Extension
		file.Extension.Valid = true
	}

	if req.StorageProvider != "" {
		file.StorageProvider = req.StorageProvider
	}

	if req.Visibility != "" {
		file.Visibility = req.Visibility
	}

	if req.UploadedBy != nil {
		file.UploadedBy.String = req.UploadedBy.String()
		file.UploadedBy.Valid = true
	}

	// Set items snapshot
	if req.ItemsSnapshot != nil {
		itemsJSON, err := json.Marshal(req.ItemsSnapshot)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal items_snapshot: %w", err)
		}
		file.ItemsSnapshot = itemsJSON
	} else {
		file.ItemsSnapshot = []byte("[]")
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		file.Metadata = metadataJSON
	} else {
		file.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to create storage file: %w", err)
	}

	return file, nil
}

func (s *storageFileService) GetFile(ctx context.Context, id uuid.UUID) (*models.StorageFile, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *storageFileService) ListFiles(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, category, status *string, isFolder *bool) ([]*models.StorageFile, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, category, status, isFolder)
}

func (s *storageFileService) ListFilesByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *storageFileService) ListFilesByParent(ctx context.Context, parentID uuid.UUID) ([]*models.StorageFile, error) {
	return s.repo.ListByParentID(ctx, parentID)
}

func (s *storageFileService) ListFilesByCategory(ctx context.Context, category string) ([]*models.StorageFile, error) {
	return s.repo.ListByCategory(ctx, category)
}

func (s *storageFileService) ListFolders(ctx context.Context, tenantID uuid.UUID) ([]*models.StorageFile, error) {
	return s.repo.ListFolders(ctx, tenantID)
}

func (s *storageFileService) UpdateFile(ctx context.Context, id uuid.UUID, req *models.UpdateStorageFileRequest) (*models.StorageFile, error) {
	file, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.OriginalName != nil {
		file.OriginalName = *req.OriginalName
	}

	if req.StoragePath != nil {
		if *req.StoragePath == "" {
			file.StoragePath.Valid = false
		} else {
			file.StoragePath.String = *req.StoragePath
			file.StoragePath.Valid = true
		}
	}

	if req.PublicURL != nil {
		if *req.PublicURL == "" {
			file.PublicURL.Valid = false
		} else {
			file.PublicURL.String = *req.PublicURL
			file.PublicURL.Valid = true
		}
	}

	if req.Category != nil {
		file.Category = *req.Category
	}

	if req.FileSize != nil {
		file.FileSize = *req.FileSize
	}

	if req.Visibility != nil {
		file.Visibility = *req.Visibility
	}

	if req.Status != nil {
		file.Status = *req.Status
	}

	if req.ItemsSnapshot != nil {
		itemsJSON, err := json.Marshal(*req.ItemsSnapshot)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal items_snapshot: %w", err)
		}
		file.ItemsSnapshot = itemsJSON
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		file.Metadata = metadataJSON
	}

	file.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to update storage file: %w", err)
	}

	return file, nil
}

func (s *storageFileService) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *storageFileService) DeleteFile(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *storageFileService) SoftDeleteFile(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id)
}

func (s *storageFileService) GetTotalSize(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	return s.repo.GetTotalSize(ctx, tenantID)
}
