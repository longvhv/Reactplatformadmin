package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type FileUploadService struct {
	fileRepo     repository.FileUploadRepository
	storageDir   string
}

func NewFileUploadService(fileRepo repository.FileUploadRepository) *FileUploadService {
	return &FileUploadService{
		fileRepo:   fileRepo,
		storageDir: "/tmp/uploads", // In production, use S3/cloud storage
	}
}

type UploadFileRequest struct {
	TenantID    uuid.UUID
	UploadedBy  uuid.UUID
	File        *multipart.FileHeader
	Category    string
	Description string
	IsPublic    bool
}

type UpdateFileRequest struct {
	FileName    *string `json:"file_name"`
	Category    *string `json:"category"`
	Description *string `json:"description"`
	IsPublic    *bool   `json:"is_public"`
	Tags        []string `json:"tags"`
}

// GetByID gets file by ID
func (s *FileUploadService) GetByID(ctx context.Context, id uuid.UUID) (*models.FileUpload, error) {
	return s.fileRepo.GetByID(ctx, id)
}

// ListFiles lists files
func (s *FileUploadService) ListFiles(ctx context.Context, tenantID uuid.UUID, category, fileType string, page, limit int) ([]*models.FileUpload, int64, error) {
	offset := (page - 1) * limit
	return s.fileRepo.ListByTenant(ctx, tenantID, category, fileType, limit, offset)
}

// UploadFile uploads a new file
func (s *FileUploadService) UploadFile(ctx context.Context, req UploadFileRequest) (*models.FileUpload, error) {
	// Open uploaded file
	src, err := req.File.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Read file content
	content, err := io.ReadAll(src)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Calculate checksum
	checksum := s.calculateChecksum(content)

	// Detect file type
	fileType := s.detectFileType(req.File.Filename)
	mimeType := s.detectMimeType(req.File.Filename)

	// Generate storage path
	storagePath := s.generateStoragePath(req.TenantID, req.File.Filename)

	// In production, upload to S3/cloud storage
	// For now, we'll just store metadata

	fileSize := int64(len(content))

	category := req.Category
	if category == "" {
		category = "general"
	}

	now := time.Now()
	file := &models.FileUpload{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		FileName:     req.File.Filename,
		OriginalName: req.File.Filename,
		FileSize:     fileSize,
		FileType:     fileType,
		MimeType:     mimeType,
		StoragePath:  storagePath,
		Checksum:     &checksum,
		Category:     &category,
		Description:  &req.Description,
		IsPublic:     req.IsPublic,
		UploadedBy:   req.UploadedBy,
		DownloadCount: 0,
		Tags:         []string{},
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.fileRepo.Create(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to create file record: %w", err)
	}

	return file, nil
}

// UpdateFile updates file metadata
func (s *FileUploadService) UpdateFile(ctx context.Context, id uuid.UUID, req UpdateFileRequest) (*models.FileUpload, error) {
	file, err := s.fileRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if req.FileName != nil {
		file.FileName = *req.FileName
	}
	if req.Category != nil {
		file.Category = req.Category
	}
	if req.Description != nil {
		file.Description = req.Description
	}
	if req.IsPublic != nil {
		file.IsPublic = *req.IsPublic
	}
	if req.Tags != nil {
		file.Tags = req.Tags
	}

	file.UpdatedAt = time.Now()

	if err := s.fileRepo.Update(ctx, file); err != nil {
		return nil, fmt.Errorf("failed to update file: %w", err)
	}

	return file, nil
}

// DeleteFile deletes a file
func (s *FileUploadService) DeleteFile(ctx context.Context, id uuid.UUID) error {
	file, err := s.fileRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// In production, delete from S3/cloud storage
	// For now, just delete the record

	if err := s.fileRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	// Mark as deleted instead of hard delete
	now := time.Now()
	file.DeletedAt = &now
	_ = s.fileRepo.Update(ctx, file)

	return nil
}

// DownloadFile downloads a file
func (s *FileUploadService) DownloadFile(ctx context.Context, id uuid.UUID) ([]byte, string, error) {
	file, err := s.fileRepo.GetByID(ctx, id)
	if err != nil {
		return nil, "", fmt.Errorf("file not found: %w", err)
	}

	// In production, download from S3/cloud storage
	// For now, return mock data
	mockData := []byte("File content placeholder")

	// Increment download count
	file.DownloadCount++
	file.LastAccessedAt = timePtr(time.Now())
	file.UpdatedAt = time.Now()
	_ = s.fileRepo.Update(ctx, file)

	return mockData, file.FileName, nil
}

// GetPublicURL generates a public URL for file
func (s *FileUploadService) GetPublicURL(ctx context.Context, id uuid.UUID, expiresIn int) (string, error) {
	file, err := s.fileRepo.GetByID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("file not found: %w", err)
	}

	if !file.IsPublic {
		return "", fmt.Errorf("file is not public")
	}

	// In production, generate signed URL from S3/cloud storage
	url := fmt.Sprintf("https://storage.example.com/files/%s/%s?expires=%d",
		file.TenantID.String(),
		file.ID.String(),
		time.Now().Unix()+int64(expiresIn))

	// Update access tracking
	file.LastAccessedAt = timePtr(time.Now())
	_ = s.fileRepo.Update(ctx, file)

	return url, nil
}

// GetStats gets file statistics
func (s *FileUploadService) GetStats(ctx context.Context, tenantID uuid.UUID) (map[string]interface{}, error) {
	files, _, err := s.fileRepo.ListByTenant(ctx, tenantID, "", "", 10000, 0)
	if err != nil {
		return nil, err
	}

	var totalSize int64
	var totalDownloads int64
	typeCount := make(map[string]int)
	categoryCount := make(map[string]int)

	for _, file := range files {
		totalSize += file.FileSize
		totalDownloads += int64(file.DownloadCount)
		typeCount[file.FileType]++
		if file.Category != nil {
			categoryCount[*file.Category]++
		}
	}

	stats := map[string]interface{}{
		"total_files":     len(files),
		"total_size":      totalSize,
		"total_downloads": totalDownloads,
		"by_type":         typeCount,
		"by_category":     categoryCount,
		"avg_file_size":   0,
	}

	if len(files) > 0 {
		stats["avg_file_size"] = totalSize / int64(len(files))
	}

	return stats, nil
}

// SearchFiles searches files
func (s *FileUploadService) SearchFiles(ctx context.Context, tenantID uuid.UUID, query string, page, limit int) ([]*models.FileUpload, int64, error) {
	// In production, use full-text search
	files, total, err := s.fileRepo.ListByTenant(ctx, tenantID, "", "", limit*10, 0)
	if err != nil {
		return nil, 0, err
	}

	// Simple filter by filename
	filtered := make([]*models.FileUpload, 0)
	for _, file := range files {
		if strings.Contains(strings.ToLower(file.FileName), strings.ToLower(query)) {
			filtered = append(filtered, file)
		}
	}

	// Pagination
	offset := (page - 1) * limit
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}

	if offset > len(filtered) {
		return []*models.FileUpload{}, 0, nil
	}

	return filtered[offset:end], int64(len(filtered)), nil
}

// GetFilesByUser gets files uploaded by user
func (s *FileUploadService) GetFilesByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]*models.FileUpload, int64, error) {
	// This would need a custom repository method
	// For now, return empty
	return []*models.FileUpload{}, 0, nil
}

// Helper functions
func (s *FileUploadService) calculateChecksum(content []byte) string {
	hash := sha256.Sum256(content)
	return hex.EncodeToString(hash[:])
}

func (s *FileUploadService) detectFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	
	imageExts := []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"}
	videoExts := []string{".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"}
	audioExts := []string{".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"}
	docExts := []string{".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"}
	archiveExts := []string{".zip", ".rar", ".7z", ".tar", ".gz"}

	for _, e := range imageExts {
		if ext == e {
			return "image"
		}
	}
	for _, e := range videoExts {
		if ext == e {
			return "video"
		}
	}
	for _, e := range audioExts {
		if ext == e {
			return "audio"
		}
	}
	for _, e := range docExts {
		if ext == e {
			return "document"
		}
	}
	for _, e := range archiveExts {
		if ext == e {
			return "archive"
		}
	}

	return "other"
}

func (s *FileUploadService) detectMimeType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	
	mimeTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".svg":  "image/svg+xml",
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".zip":  "application/zip",
		".mp4":  "video/mp4",
		".mp3":  "audio/mpeg",
		".txt":  "text/plain",
	}

	if mime, ok := mimeTypes[ext]; ok {
		return mime
	}

	return "application/octet-stream"
}

func (s *FileUploadService) generateStoragePath(tenantID uuid.UUID, filename string) string {
	// Generate path: tenant_id/year/month/uuid_filename
	now := time.Now()
	fileID := uuid.New()
	ext := filepath.Ext(filename)
	
	return fmt.Sprintf("%s/%d/%02d/%s%s",
		tenantID.String(),
		now.Year(),
		now.Month(),
		fileID.String(),
		ext)
}

func timePtr(t time.Time) *time.Time {
	return &t
}
