package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockFileUploadRepository struct {
	mock.Mock
}

func (m *MockFileUploadRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.FileUpload, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FileUpload), args.Error(1)
}

func (m *MockFileUploadRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, fileType, status string, limit, offset int) ([]*models.FileUpload, int64, error) {
	args := m.Called(ctx, tenantID, fileType, status, limit, offset)
	return args.Get(0).([]*models.FileUpload), args.Get(1).(int64), args.Error(2)
}

func (m *MockFileUploadRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.FileUpload, int64, error) {
	args := m.Called(ctx, userID, limit, offset)
	return args.Get(0).([]*models.FileUpload), args.Get(1).(int64), args.Error(2)
}

func (m *MockFileUploadRepository) Create(ctx context.Context, file *models.FileUpload) error {
	args := m.Called(ctx, file)
	return args.Error(0)
}

func (m *MockFileUploadRepository) Update(ctx context.Context, file *models.FileUpload) error {
	args := m.Called(ctx, file)
	return args.Error(0)
}

func (m *MockFileUploadRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateFileUpload(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()

	req := CreateFileUploadRequest{
		TenantID:     tenantID,
		UploadedBy:   userID,
		FileName:     "test.pdf",
		FileSize:     1024,
		FileType:     "application/pdf",
		StoragePath:  "/uploads/test.pdf",
		OriginalName: "document.pdf",
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.FileUpload")).Return(nil)

	file, err := service.CreateFileUpload(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, file)
	assert.Equal(t, "test.pdf", file.FileName)
	assert.Equal(t, int64(1024), file.FileSize)
	assert.Equal(t, "pending", file.Status)
	assert.NotEmpty(t, file.Checksum)
	mockRepo.AssertExpectations(t)
}

func TestCreateFileUpload_InvalidFileType(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	req := CreateFileUploadRequest{
		TenantID:     uuid.New(),
		UploadedBy:   uuid.New(),
		FileName:     "test.exe",
		FileSize:     1024,
		FileType:     "application/x-msdownload",
		StoragePath:  "/uploads/test.exe",
		OriginalName: "malware.exe",
	}

	_, err := service.CreateFileUpload(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "file type not allowed")
}

func TestCreateFileUpload_FileTooLarge(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	req := CreateFileUploadRequest{
		TenantID:     uuid.New(),
		UploadedBy:   uuid.New(),
		FileName:     "huge.pdf",
		FileSize:     200 * 1024 * 1024, // 200MB
		FileType:     "application/pdf",
		StoragePath:  "/uploads/huge.pdf",
		OriginalName: "huge.pdf",
	}

	_, err := service.CreateFileUpload(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "file size exceeds maximum")
}

func TestMarkAsCompleted(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	file := &models.FileUpload{
		ID:     fileID,
		Status: "pending",
	}

	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.FileUpload")).Return(nil)

	result, err := service.MarkAsCompleted(context.Background(), fileID, "https://cdn.example.com/test.pdf")

	assert.NoError(t, err)
	assert.Equal(t, "completed", result.Status)
	assert.NotNil(t, result.CompletedAt)
	assert.Equal(t, "https://cdn.example.com/test.pdf", *result.PublicURL)
	mockRepo.AssertExpectations(t)
}

func TestMarkAsFailed(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	file := &models.FileUpload{
		ID:     fileID,
		Status: "pending",
	}

	errorMsg := "Upload failed"
	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.FileUpload")).Return(nil)

	result, err := service.MarkAsFailed(context.Background(), fileID, errorMsg)

	assert.NoError(t, err)
	assert.Equal(t, "failed", result.Status)
	assert.Equal(t, errorMsg, *result.ErrorMessage)
	mockRepo.AssertExpectations(t)
}

func TestScanFile(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	file := &models.FileUpload{
		ID:     fileID,
		Status: "completed",
	}

	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.FileUpload")).Return(nil)

	result, err := service.ScanFile(context.Background(), fileID)

	assert.NoError(t, err)
	assert.Equal(t, "scanned", result.Status)
	assert.NotNil(t, result.ScanResult)
	assert.NotNil(t, result.ScannedAt)
	mockRepo.AssertExpectations(t)
}

func TestValidateChecksum(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	checksum := service.generateChecksum("test-file-content")
	file := &models.FileUpload{
		ID:       fileID,
		Checksum: checksum,
	}

	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)

	valid, err := service.ValidateChecksum(context.Background(), fileID, checksum)

	assert.NoError(t, err)
	assert.True(t, valid)
	mockRepo.AssertExpectations(t)
}

func TestValidateChecksum_Mismatch(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	file := &models.FileUpload{
		ID:       fileID,
		Checksum: "original-checksum",
	}

	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)

	valid, err := service.ValidateChecksum(context.Background(), fileID, "wrong-checksum")

	assert.NoError(t, err)
	assert.False(t, valid)
	mockRepo.AssertExpectations(t)
}

func TestGetStats(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	tenantID := uuid.New()
	files := []*models.FileUpload{
		{ID: uuid.New(), Status: "completed", FileSize: 1000, FileType: "application/pdf"},
		{ID: uuid.New(), Status: "completed", FileSize: 2000, FileType: "image/png"},
		{ID: uuid.New(), Status: "failed", FileSize: 500, FileType: "application/pdf"},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(files, int64(3), nil)

	stats, err := service.GetStats(context.Background(), tenantID, "", "")

	assert.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 3, stats["total_files"])
	assert.Equal(t, int64(3500), stats["total_size"])
	
	byStatus := stats["by_status"].(map[string]int)
	assert.Equal(t, 2, byStatus["completed"])
	assert.Equal(t, 1, byStatus["failed"])
	
	byType := stats["by_type"].(map[string]int)
	assert.Equal(t, 2, byType["application/pdf"])
	assert.Equal(t, 1, byType["image/png"])
	
	mockRepo.AssertExpectations(t)
}

func TestCleanupOldFiles(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	tenantID := uuid.New()
	oldDate := time.Now().AddDate(0, 0, -100)
	
	files := []*models.FileUpload{
		{ID: uuid.New(), CreatedAt: oldDate, Status: "completed"},
		{ID: uuid.New(), CreatedAt: oldDate, Status: "completed"},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 10000, 0).Return(files, int64(2), nil)
	mockRepo.On("Delete", mock.Anything, mock.AnythingOfType("uuid.UUID")).Return(nil).Times(2)

	count, err := service.CleanupOldFiles(context.Background(), tenantID, 30)

	assert.NoError(t, err)
	assert.Equal(t, 2, count)
	mockRepo.AssertExpectations(t)
}

func TestGeneratePresignedURL(t *testing.T) {
	mockRepo := new(MockFileUploadRepository)
	service := NewFileUploadService(mockRepo)

	fileID := uuid.New()
	file := &models.FileUpload{
		ID:          fileID,
		StoragePath: "/uploads/test.pdf",
		Status:      "completed",
	}

	mockRepo.On("GetByID", mock.Anything, fileID).Return(file, nil)

	url, expiresAt, err := service.GeneratePresignedURL(context.Background(), fileID, 3600)

	assert.NoError(t, err)
	assert.NotEmpty(t, url)
	assert.NotNil(t, expiresAt)
	assert.True(t, expiresAt.After(time.Now()))
	mockRepo.AssertExpectations(t)
}

func TestIsAllowedFileType(t *testing.T) {
	service := NewFileUploadService(nil)

	tests := []struct {
		name     string
		fileType string
		expected bool
	}{
		{"PDF allowed", "application/pdf", true},
		{"PNG allowed", "image/png", true},
		{"JPEG allowed", "image/jpeg", true},
		{"DOC allowed", "application/msword", true},
		{"DOCX allowed", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true},
		{"XLS allowed", "application/vnd.ms-excel", true},
		{"XLSX allowed", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", true},
		{"ZIP allowed", "application/zip", true},
		{"TXT allowed", "text/plain", true},
		{"EXE not allowed", "application/x-msdownload", false},
		{"SH not allowed", "application/x-sh", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.isAllowedFileType(tt.fileType)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFormatFileSize(t *testing.T) {
	service := NewFileUploadService(nil)

	tests := []struct {
		name     string
		size     int64
		expected string
	}{
		{"Bytes", 500, "500 B"},
		{"Kilobytes", 1024, "1.00 KB"},
		{"Megabytes", 1024 * 1024, "1.00 MB"},
		{"Gigabytes", 1024 * 1024 * 1024, "1.00 GB"},
		{"Large file", 5 * 1024 * 1024 * 1024, "5.00 GB"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.formatFileSize(tt.size)
			assert.Equal(t, tt.expected, result)
		})
	}
}
