package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type DataExportService struct {
	exportRepo repository.DataExportRepository
}

func NewDataExportService(exportRepo repository.DataExportRepository) *DataExportService {
	return &DataExportService{
		exportRepo: exportRepo,
	}
}

type CreateDataExportRequest struct {
	TenantID    uuid.UUID              `json:"tenant_id" binding:"required"`
	ExportType  string                 `json:"export_type" binding:"required"`
	Format      string                 `json:"format" binding:"required"`
	EntityType  string                 `json:"entity_type" binding:"required"`
	Filters     map[string]interface{} `json:"filters"`
	Columns     []string               `json:"columns"`
	DateRange   *DateRange             `json:"date_range"`
	Compression *string                `json:"compression"`
	RequestedBy uuid.UUID              `json:"-"`
}

type DateRange struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

// GetByID gets export by ID
func (s *DataExportService) GetByID(ctx context.Context, id uuid.UUID) (*models.DataExport, error) {
	return s.exportRepo.GetByID(ctx, id)
}

// ListByTenant lists exports by tenant
func (s *DataExportService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]*models.DataExport, int64, error) {
	offset := (page - 1) * limit
	return s.exportRepo.ListByTenant(ctx, tenantID, status, limit, offset)
}

// CreateExport creates a new export request
func (s *DataExportService) CreateExport(ctx context.Context, req CreateDataExportRequest) (*models.DataExport, error) {
	// Validate export type
	validTypes := []string{"full", "incremental", "filtered", "custom"}
	if !containsExportType(validTypes, req.ExportType) {
		return nil, fmt.Errorf("invalid export type, must be one of: %v", validTypes)
	}

	// Validate format
	validFormats := []string{"csv", "json", "xml", "excel", "pdf"}
	if !containsExportType(validFormats, req.Format) {
		return nil, fmt.Errorf("invalid format, must be one of: %v", validFormats)
	}

	// Validate entity type
	validEntities := []string{"users", "tenants", "orders", "products", "invoices", "logs", "custom"}
	if !containsExportType(validEntities, req.EntityType) {
		return nil, fmt.Errorf("invalid entity type, must be one of: %v", validEntities)
	}

	filters := req.Filters
	if filters == nil {
		filters = make(map[string]interface{})
	}

	columns := req.Columns
	if columns == nil {
		columns = []string{}
	}

	export := &models.DataExport{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		ExportType:  req.ExportType,
		Format:      req.Format,
		EntityType:  req.EntityType,
		Filters:     filters,
		Columns:     columns,
		Status:      "pending",
		Progress:    0,
		Compression: req.Compression,
		RequestedBy: req.RequestedBy,
		RequestedAt: time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if req.DateRange != nil {
		if req.DateRange.StartDate != "" {
			startDate, err := time.Parse(time.RFC3339, req.DateRange.StartDate)
			if err == nil {
				export.StartDate = &startDate
			}
		}
		if req.DateRange.EndDate != "" {
			endDate, err := time.Parse(time.RFC3339, req.DateRange.EndDate)
			if err == nil {
				export.EndDate = &endDate
			}
		}
	}

	if err := s.exportRepo.Create(ctx, export); err != nil {
		return nil, fmt.Errorf("failed to create export: %w", err)
	}

	// Start export asynchronously
	go s.processExport(export)

	return export, nil
}

// CancelExport cancels an export
func (s *DataExportService) CancelExport(ctx context.Context, id uuid.UUID) (*models.DataExport, error) {
	export, err := s.exportRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("export not found: %w", err)
	}

	if export.Status != "pending" && export.Status != "processing" {
		return nil, fmt.Errorf("cannot cancel export with status: %s", export.Status)
	}

	export.Status = "cancelled"
	export.UpdatedAt = time.Now()

	if err := s.exportRepo.Update(ctx, export); err != nil {
		return nil, fmt.Errorf("failed to cancel export: %w", err)
	}

	return export, nil
}

// DeleteExport deletes an export
func (s *DataExportService) DeleteExport(ctx context.Context, id uuid.UUID) error {
	export, err := s.exportRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete file if exists
	if export.FilePath != nil {
		// In production, delete from S3/cloud storage
	}

	return s.exportRepo.Delete(ctx, id)
}

// DownloadExport downloads exported file
func (s *DataExportService) DownloadExport(ctx context.Context, id uuid.UUID) ([]byte, string, error) {
	export, err := s.exportRepo.GetByID(ctx, id)
	if err != nil {
		return nil, "", fmt.Errorf("export not found: %w", err)
	}

	if export.Status != "completed" {
		return nil, "", fmt.Errorf("export is not completed, current status: %s", export.Status)
	}

	if export.FilePath == nil {
		return nil, "", fmt.Errorf("export file not found")
	}

	// In production, download from S3/cloud storage
	// For now, return mock data
	mockData := s.generateMockExportData(export)

	// Update download tracking
	export.DownloadCount++
	export.LastDownloadedAt = timePointer(time.Now())
	export.UpdatedAt = time.Now()
	_ = s.exportRepo.Update(ctx, export)

	fileName := fmt.Sprintf("export_%s_%s.%s",
		export.EntityType,
		export.ID.String()[:8],
		export.Format)

	return mockData, fileName, nil
}

// RetryExport retries a failed export
func (s *DataExportService) RetryExport(ctx context.Context, id uuid.UUID) (*models.DataExport, error) {
	export, err := s.exportRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("export not found: %w", err)
	}

	if export.Status != "failed" {
		return nil, fmt.Errorf("can only retry failed exports, current status: %s", export.Status)
	}

	export.Status = "pending"
	export.Progress = 0
	export.ErrorMessage = nil
	export.UpdatedAt = time.Now()

	if err := s.exportRepo.Update(ctx, export); err != nil {
		return nil, fmt.Errorf("failed to retry export: %w", err)
	}

	// Start export asynchronously
	go s.processExport(export)

	return export, nil
}

// GetStats gets export statistics
func (s *DataExportService) GetStats(ctx context.Context, tenantID uuid.UUID) (map[string]interface{}, error) {
	exports, _, err := s.exportRepo.ListByTenant(ctx, tenantID, "", 10000, 0)
	if err != nil {
		return nil, err
	}

	statusCount := make(map[string]int)
	formatCount := make(map[string]int)
	var totalSize int64
	var totalRows int64

	for _, export := range exports {
		statusCount[export.Status]++
		formatCount[export.Format]++
		if export.FileSize != nil {
			totalSize += *export.FileSize
		}
		if export.RowCount != nil {
			totalRows += int64(*export.RowCount)
		}
	}

	stats := map[string]interface{}{
		"total_exports":    len(exports),
		"by_status":        statusCount,
		"by_format":        formatCount,
		"total_file_size":  totalSize,
		"total_rows":       totalRows,
		"pending":          statusCount["pending"],
		"processing":       statusCount["processing"],
		"completed":        statusCount["completed"],
		"failed":           statusCount["failed"],
	}

	return stats, nil
}

// processExport processes export asynchronously
func (s *DataExportService) processExport(export *models.DataExport) {
	ctx := context.Background()

	// Update status to processing
	export.Status = "processing"
	export.StartedAt = timePointer(time.Now())
	_ = s.exportRepo.Update(ctx, export)

	// Simulate export processing
	time.Sleep(3 * time.Second)

	// Mock success
	now := time.Now()
	rowCount := 1000
	fileSize := int64(50000)
	filePath := fmt.Sprintf("/exports/%s/%s.%s",
		export.TenantID.String(),
		export.ID.String(),
		export.Format)

	export.Status = "completed"
	export.Progress = 100
	export.CompletedAt = &now
	export.RowCount = &rowCount
	export.FileSize = &fileSize
	export.FilePath = &filePath
	export.UpdatedAt = now

	_ = s.exportRepo.Update(ctx, export)
}

// generateMockExportData generates mock export data
func (s *DataExportService) generateMockExportData(export *models.DataExport) []byte {
	switch export.Format {
	case "json":
		data := []map[string]interface{}{
			{"id": 1, "name": "Item 1", "value": 100},
			{"id": 2, "name": "Item 2", "value": 200},
			{"id": 3, "name": "Item 3", "value": 300},
		}
		jsonData, _ := json.MarshalIndent(data, "", "  ")
		return jsonData

	case "csv":
		var builder strings.Builder
		writer := csv.NewWriter(&builder)
		_ = writer.Write([]string{"ID", "Name", "Value"})
		_ = writer.Write([]string{"1", "Item 1", "100"})
		_ = writer.Write([]string{"2", "Item 2", "200"})
		_ = writer.Write([]string{"3", "Item 3", "300"})
		writer.Flush()
		return []byte(builder.String())

	case "xml":
		xml := `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <item><id>1</id><name>Item 1</name><value>100</value></item>
  <item><id>2</id><name>Item 2</name><value>200</value></item>
  <item><id>3</id><name>Item 3</name><value>300</value></item>
</export>`
		return []byte(xml)

	default:
		return []byte("Export data placeholder")
	}
}

func containsExportType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func timePointer(t time.Time) *time.Time {
	return &t
}
