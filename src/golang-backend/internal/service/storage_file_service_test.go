package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockStorageFileRepository is a mock of StorageFileRepository
type MockStorageFileRepository struct {
	mock.Mock
}

func (m *MockStorageFileRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.StorageFile, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StorageFile), args.Error(1)
}

func (m *MockStorageFileRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, category string, parentID *uuid.UUID, limit, offset int) ([]*models.StorageFile, int64, error) {
	args := m.Called(ctx, tenantID, category, parentID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.StorageFile), args.Get(1).(int64), args.Error(2)
}

func (m *MockStorageFileRepository) HasChildren(ctx context.Context, folderID uuid.UUID) (bool, error) {
	args := m.Called(ctx, folderID)
	return args.Bool(0), args.Error(1)
}

func (m *MockStorageFileRepository) Create(ctx context.Context, file *models.StorageFile) error {
	args := m.Called(ctx, file)
	return args.Error(0)
}

func (m *MockStorageFileRepository) Update(ctx context.Context, file *models.StorageFile) error {
	args := m.Called(ctx, file)
	return args.Error(0)
}

func (m *MockStorageFileRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestStorageFileService_UploadFile(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		req := UploadFileRequest{
			TenantID:     uuid.New(),
			OriginalName: "document.pdf",
			MimeType:     "application/pdf",
			FileSize:     1024000,
			UploadedBy:   uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		file, err := service.UploadFile(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, file)
		assert.False(t, file.IsFolder)
		assert.Equal(t, "document.pdf", file.OriginalName)
		assert.Equal(t, "DOCUMENT", file.Category) // Auto-detected
		assert.Equal(t, "S3", file.StorageProvider) // Default
		assert.Equal(t, "PRIVATE", file.Visibility) // Default
		assert.Equal(t, "READY", file.Status) // Updated after upload
		assert.Equal(t, "pdf", *file.Extension)
		assert.Equal(t, int64(1024000), file.FileSize)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		parentID := uuid.New()
		storagePath := "/uploads/2024/01/file.jpg"
		publicURL := "https://cdn.example.com/file.jpg"
		req := UploadFileRequest{
			TenantID:        uuid.New(),
			ParentID:        &parentID,
			OriginalName:    "photo.jpg",
			StoragePath:     &storagePath,
			PublicURL:       &publicURL,
			Category:        "MEDIA",
			MimeType:        "image/jpeg",
			FileSize:        512000,
			StorageProvider: "R2",
			Visibility:      "PUBLIC",
			Metadata: map[string]interface{}{
				"width":  1920,
				"height": 1080,
			},
			UploadedBy: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		file, err := service.UploadFile(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "MEDIA", file.Category)
		assert.Equal(t, "R2", file.StorageProvider)
		assert.Equal(t, "PUBLIC", file.Visibility)
		assert.Equal(t, storagePath, *file.StoragePath)
		assert.NotNil(t, file.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-detect media category", func(t *testing.T) {
		req := UploadFileRequest{
			TenantID:     uuid.New(),
			OriginalName: "video.mp4",
			MimeType:     "video/mp4",
			FileSize:     10240000,
			UploadedBy:   uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		file, err := service.UploadFile(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "MEDIA", file.Category)
		assert.Equal(t, "mp4", *file.Extension)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := UploadFileRequest{
			TenantID:     uuid.New(),
			OriginalName: "file.txt",
			MimeType:     "text/plain",
			FileSize:     100,
			UploadedBy:   uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(errors.New("db error")).Once()

		file, err := service.UploadFile(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, file)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_CreateFolder(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		req := CreateFolderRequest{
			TenantID:   uuid.New(),
			FolderName: "Documents",
			UploadedBy: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		folder, err := service.CreateFolder(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, folder)
		assert.True(t, folder.IsFolder)
		assert.Equal(t, "Documents", folder.OriginalName)
		assert.Equal(t, "MEDIA", folder.Category) // Default
		assert.Equal(t, "application/x-directory", folder.MimeType)
		assert.Equal(t, int64(0), folder.FileSize)
		assert.Equal(t, "S3", folder.StorageProvider)
		assert.Equal(t, "PRIVATE", folder.Visibility)
		assert.Equal(t, "READY", folder.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with parent and category", func(t *testing.T) {
		parentID := uuid.New()
		req := CreateFolderRequest{
			TenantID:   uuid.New(),
			ParentID:   &parentID,
			FolderName: "Sub Folder",
			Category:   "DOCUMENT",
			Metadata: map[string]interface{}{
				"description": "Project documents",
			},
			UploadedBy: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		folder, err := service.CreateFolder(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, &parentID, folder.ParentID)
		assert.Equal(t, "DOCUMENT", folder.Category)
		assert.NotNil(t, folder.Metadata)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_UpdateFile(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		fileID := uuid.New()
		existing := &models.StorageFile{
			ID:           fileID,
			OriginalName: "old_name.pdf",
			Category:     "DOCUMENT",
			Visibility:   "PRIVATE",
			Status:       "UPLOADING",
			Version:      1,
		}

		newName := "new_name.pdf"
		newCategory := "MEDIA"
		newVisibility := "PUBLIC"
		newStatus := "READY"
		req := UpdateStorageFileRequest{
			OriginalName: &newName,
			Category:     &newCategory,
			Visibility:   &newVisibility,
			Status:       &newStatus,
			Metadata: map[string]interface{}{
				"updated": true,
			},
		}

		mockRepo.On("GetByID", ctx, fileID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		file, err := service.UpdateFile(ctx, fileID, req)

		assert.NoError(t, err)
		assert.Equal(t, "new_name.pdf", file.OriginalName)
		assert.Equal(t, "MEDIA", file.Category)
		assert.Equal(t, "PUBLIC", file.Visibility)
		assert.Equal(t, "READY", file.Status)
		assert.Equal(t, 2, file.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("file not found", func(t *testing.T) {
		fileID := uuid.New()
		req := UpdateStorageFileRequest{}

		mockRepo.On("GetByID", ctx, fileID).Return(nil, errors.New("not found")).Once()

		file, err := service.UpdateFile(ctx, fileID, req)

		assert.Error(t, err)
		assert.Nil(t, file)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_DeleteFile(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success - delete file", func(t *testing.T) {
		fileID := uuid.New()
		existing := &models.StorageFile{
			ID:       fileID,
			IsFolder: false,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, fileID).Return(nil).Once()

		err := service.DeleteFile(ctx, fileID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - delete empty folder", func(t *testing.T) {
		folderID := uuid.New()
		existing := &models.StorageFile{
			ID:       folderID,
			IsFolder: true,
		}

		mockRepo.On("GetByID", ctx, folderID).Return(existing, nil).Once()
		mockRepo.On("HasChildren", ctx, folderID).Return(false, nil).Once()
		mockRepo.On("Delete", ctx, folderID).Return(nil).Once()

		err := service.DeleteFile(ctx, folderID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot delete folder with children", func(t *testing.T) {
		folderID := uuid.New()
		existing := &models.StorageFile{
			ID:       folderID,
			IsFolder: true,
		}

		mockRepo.On("GetByID", ctx, folderID).Return(existing, nil).Once()
		mockRepo.On("HasChildren", ctx, folderID).Return(true, nil).Once()

		err := service.DeleteFile(ctx, folderID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete folder with children")
		mockRepo.AssertExpectations(t)
	})

	t.Run("file not found", func(t *testing.T) {
		fileID := uuid.New()

		mockRepo.On("GetByID", ctx, fileID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteFile(ctx, fileID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_MoveFile(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success - move to folder", func(t *testing.T) {
		fileID := uuid.New()
		newParentID := uuid.New()
		tenantID := uuid.New()

		file := &models.StorageFile{
			ID:       fileID,
			TenantID: tenantID,
			Version:  1,
		}
		parent := &models.StorageFile{
			ID:       newParentID,
			TenantID: tenantID,
			IsFolder: true,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("GetByID", ctx, newParentID).Return(parent, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		movedFile, err := service.MoveFile(ctx, fileID, &newParentID)

		assert.NoError(t, err)
		assert.Equal(t, &newParentID, movedFile.ParentID)
		assert.Equal(t, 2, movedFile.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - move to root", func(t *testing.T) {
		fileID := uuid.New()
		file := &models.StorageFile{
			ID:      fileID,
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		movedFile, err := service.MoveFile(ctx, fileID, nil)

		assert.NoError(t, err)
		assert.Nil(t, movedFile.ParentID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("parent not found", func(t *testing.T) {
		fileID := uuid.New()
		newParentID := uuid.New()
		file := &models.StorageFile{ID: fileID}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("GetByID", ctx, newParentID).Return(nil, errors.New("not found")).Once()

		movedFile, err := service.MoveFile(ctx, fileID, &newParentID)

		assert.Error(t, err)
		assert.Nil(t, movedFile)
		mockRepo.AssertExpectations(t)
	})

	t.Run("parent is not a folder", func(t *testing.T) {
		fileID := uuid.New()
		newParentID := uuid.New()
		file := &models.StorageFile{ID: fileID}
		parent := &models.StorageFile{
			ID:       newParentID,
			IsFolder: false,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("GetByID", ctx, newParentID).Return(parent, nil).Once()

		movedFile, err := service.MoveFile(ctx, fileID, &newParentID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "must be a folder")
		assert.Nil(t, movedFile)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot move to different tenant", func(t *testing.T) {
		fileID := uuid.New()
		newParentID := uuid.New()
		tenantID1 := uuid.New()
		tenantID2 := uuid.New()

		file := &models.StorageFile{
			ID:       fileID,
			TenantID: tenantID1,
		}
		parent := &models.StorageFile{
			ID:       newParentID,
			TenantID: tenantID2,
			IsFolder: true,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("GetByID", ctx, newParentID).Return(parent, nil).Once()

		movedFile, err := service.MoveFile(ctx, fileID, &newParentID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "different tenant")
		assert.Nil(t, movedFile)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_GetPublicURL(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success - existing URL", func(t *testing.T) {
		fileID := uuid.New()
		existingURL := "https://cdn.example.com/file.jpg"
		file := &models.StorageFile{
			ID:        fileID,
			IsFolder:  false,
			PublicURL: &existingURL,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()

		url, err := service.GetPublicURL(ctx, fileID)

		assert.NoError(t, err)
		assert.Equal(t, existingURL, url)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - generate URL", func(t *testing.T) {
		fileID := uuid.New()
		tenantID := uuid.New()
		file := &models.StorageFile{
			ID:        fileID,
			TenantID:  tenantID,
			IsFolder:  false,
			PublicURL: nil,
		}

		mockRepo.On("GetByID", ctx, fileID).Return(file, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.StorageFile")).Return(nil).Once()

		url, err := service.GetPublicURL(ctx, fileID)

		assert.NoError(t, err)
		assert.NotEmpty(t, url)
		assert.Contains(t, url, tenantID.String())
		assert.Contains(t, url, fileID.String())
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot get URL for folder", func(t *testing.T) {
		folderID := uuid.New()
		folder := &models.StorageFile{
			ID:       folderID,
			IsFolder: true,
		}

		mockRepo.On("GetByID", ctx, folderID).Return(folder, nil).Once()

		url, err := service.GetPublicURL(ctx, folderID)

		assert.Error(t, err)
		assert.Empty(t, url)
		assert.Contains(t, err.Error(), "cannot get public URL for folder")
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_GetByID(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		fileID := uuid.New()
		expected := &models.StorageFile{
			ID:           fileID,
			OriginalName: "file.pdf",
		}

		mockRepo.On("GetByID", ctx, fileID).Return(expected, nil).Once()

		file, err := service.GetByID(ctx, fileID)

		assert.NoError(t, err)
		assert.NotNil(t, file)
		assert.Equal(t, fileID, file.ID)
		mockRepo.AssertExpectations(t)
	})
}

func TestStorageFileService_ListByTenant(t *testing.T) {
	mockRepo := new(MockStorageFileRepository)
	service := NewStorageFileService(mockRepo)
	ctx := context.Background()

	t.Run("success - all files", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.StorageFile{
			{ID: uuid.New(), OriginalName: "file1.pdf"},
			{ID: uuid.New(), OriginalName: "file2.jpg"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", (*uuid.UUID)(nil), 10, 0).Return(expected, int64(2), nil).Once()

		files, total, err := service.ListByTenant(ctx, tenantID, "", nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, files, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with category filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.StorageFile{
			{ID: uuid.New(), Category: "MEDIA"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "MEDIA", (*uuid.UUID)(nil), 10, 0).Return(expected, int64(1), nil).Once()

		files, total, err := service.ListByTenant(ctx, tenantID, "MEDIA", nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, files, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with parent filter", func(t *testing.T) {
		tenantID := uuid.New()
		parentID := uuid.New()
		expected := []*models.StorageFile{
			{ID: uuid.New(), ParentID: &parentID},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", &parentID, 10, 0).Return(expected, int64(1), nil).Once()

		files, total, err := service.ListByTenant(ctx, tenantID, "", &parentID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, files, 1)
		mockRepo.AssertExpectations(t)
	})
}
