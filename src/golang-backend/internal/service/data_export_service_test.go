package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockDataExportRepository struct {
	mock.Mock
}

func (m *MockDataExportRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.DataExport, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DataExport), args.Error(1)
}

func (m *MockDataExportRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, exportType, status string, limit, offset int) ([]*models.DataExport, int64, error) {
	args := m.Called(ctx, tenantID, exportType, status, limit, offset)
	return args.Get(0).([]*models.DataExport), args.Get(1).(int64), args.Error(2)
}

func (m *MockDataExportRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.DataExport, int64, error) {
	args := m.Called(ctx, userID, limit, offset)
	return args.Get(0).([]*models.DataExport), args.Get(1).(int64), args.Error(2)
}

func (m *MockDataExportRepository) Create(ctx context.Context, export *models.DataExport) error {
	args := m.Called(ctx, export)
	return args.Error(0)
}

func (m *MockDataExportRepository) Update(ctx context.Context, export *models.DataExport) error {
	args := m.Called(ctx, export)
	return args.Error(0)
}

func (m *MockDataExportRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateExport(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()

	req := CreateExportRequest{
		TenantID:   tenantID,
		ExportType: "users",
		Format:     "csv",
		RequestedBy: userID,
		Filters: map[string]interface{}{
			"status": "active",
		},
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	export, err := service.CreateExport(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, export)
	assert.Equal(t, "users", export.ExportType)
	assert.Equal(t, "csv", export.Format)
	assert.Equal(t, "pending", export.Status)
	assert.NotNil(t, export.Filters)
	mockRepo.AssertExpectations(t)
}

func TestCreateExport_InvalidType(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	req := CreateExportRequest{
		TenantID:    uuid.New(),
		ExportType:  "invalid-type",
		Format:      "csv",
		RequestedBy: uuid.New(),
	}

	_, err := service.CreateExport(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid export type")
}

func TestCreateExport_InvalidFormat(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	req := CreateExportRequest{
		TenantID:    uuid.New(),
		ExportType:  "users",
		Format:      "invalid-format",
		RequestedBy: uuid.New(),
	}

	_, err := service.CreateExport(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid format")
}

func TestProcessExport(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:         exportID,
		ExportType: "users",
		Format:     "csv",
		Status:     "pending",
	}

	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	err := service.ProcessExport(context.Background(), exportID)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestMarkAsCompleted(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:     exportID,
		Status: "processing",
	}

	downloadURL := "https://storage.example.com/export.csv"
	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	result, err := service.MarkAsCompleted(context.Background(), exportID, downloadURL, 1000)

	assert.NoError(t, err)
	assert.Equal(t, "completed", result.Status)
	assert.Equal(t, downloadURL, *result.DownloadURL)
	assert.Equal(t, int64(1000), result.TotalRecords)
	assert.NotNil(t, result.CompletedAt)
	mockRepo.AssertExpectations(t)
}

func TestMarkAsFailed(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:     exportID,
		Status: "processing",
	}

	errorMsg := "Export failed due to timeout"
	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	result, err := service.MarkAsFailed(context.Background(), exportID, errorMsg)

	assert.NoError(t, err)
	assert.Equal(t, "failed", result.Status)
	assert.Equal(t, errorMsg, *result.ErrorMessage)
	mockRepo.AssertExpectations(t)
}

func TestCancelExport(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:     exportID,
		Status: "pending",
	}

	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	result, err := service.CancelExport(context.Background(), exportID)

	assert.NoError(t, err)
	assert.Equal(t, "cancelled", result.Status)
	mockRepo.AssertExpectations(t)
}

func TestCancelExport_AlreadyCompleted(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:     exportID,
		Status: "completed",
	}

	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)

	_, err := service.CancelExport(context.Background(), exportID)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot cancel")
	mockRepo.AssertExpectations(t)
}

func TestGenerateDownloadURL(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:          exportID,
		Status:      "completed",
		DownloadURL: stringP("https://storage.example.com/export.csv"),
	}

	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)

	url, expiresAt, err := service.GenerateDownloadURL(context.Background(), exportID, 3600)

	assert.NoError(t, err)
	assert.NotEmpty(t, url)
	assert.NotNil(t, expiresAt)
	assert.True(t, expiresAt.After(time.Now()))
	mockRepo.AssertExpectations(t)
}

func TestGenerateDownloadURL_NotCompleted(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	exportID := uuid.New()
	export := &models.DataExport{
		ID:     exportID,
		Status: "pending",
	}

	mockRepo.On("GetByID", mock.Anything, exportID).Return(export, nil)

	_, _, err := service.GenerateDownloadURL(context.Background(), exportID, 3600)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not completed")
	mockRepo.AssertExpectations(t)
}

func TestGetStats(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	tenantID := uuid.New()
	exports := []*models.DataExport{
		{ID: uuid.New(), Status: "completed", ExportType: "users", TotalRecords: 100},
		{ID: uuid.New(), Status: "completed", ExportType: "orders", TotalRecords: 200},
		{ID: uuid.New(), Status: "failed", ExportType: "users", TotalRecords: 0},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(exports, int64(3), nil)

	stats, err := service.GetStats(context.Background(), tenantID, "", "")

	assert.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 3, stats["total_exports"])
	assert.Equal(t, int64(300), stats["total_records"])
	
	byStatus := stats["by_status"].(map[string]int)
	assert.Equal(t, 2, byStatus["completed"])
	assert.Equal(t, 1, byStatus["failed"])
	
	byType := stats["by_type"].(map[string]int)
	assert.Equal(t, 2, byType["users"])
	assert.Equal(t, 1, byType["orders"])
	
	mockRepo.AssertExpectations(t)
}

func TestCleanupOldExports(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	tenantID := uuid.New()
	oldDate := time.Now().AddDate(0, 0, -100)
	
	exports := []*models.DataExport{
		{ID: uuid.New(), CreatedAt: oldDate, Status: "completed"},
		{ID: uuid.New(), CreatedAt: oldDate, Status: "failed"},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 10000, 0).Return(exports, int64(2), nil)
	mockRepo.On("Delete", mock.Anything, mock.AnythingOfType("uuid.UUID")).Return(nil).Times(2)

	count, err := service.CleanupOldExports(context.Background(), tenantID, 30)

	assert.NoError(t, err)
	assert.Equal(t, 2, count)
	mockRepo.AssertExpectations(t)
}

func TestExportToCSV(t *testing.T) {
	service := NewDataExportService(nil)

	data := []map[string]interface{}{
		{"id": "1", "name": "John", "email": "john@example.com"},
		{"id": "2", "name": "Jane", "email": "jane@example.com"},
	}

	columns := []string{"id", "name", "email"}

	result, err := service.exportToCSV(data, columns)

	assert.NoError(t, err)
	assert.NotNil(t, result)

	// Verify CSV content
	reader := csv.NewReader(strings.NewReader(string(result)))
	records, err := reader.ReadAll()
	assert.NoError(t, err)
	assert.Equal(t, 3, len(records)) // Header + 2 data rows
	assert.Equal(t, []string{"id", "name", "email"}, records[0])
}

func TestExportToJSON(t *testing.T) {
	service := NewDataExportService(nil)

	data := []map[string]interface{}{
		{"id": "1", "name": "John", "email": "john@example.com"},
		{"id": "2", "name": "Jane", "email": "jane@example.com"},
	}

	result, err := service.exportToJSON(data)

	assert.NoError(t, err)
	assert.NotNil(t, result)

	// Verify JSON content
	var parsed []map[string]interface{}
	err = json.Unmarshal(result, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, 2, len(parsed))
	assert.Equal(t, "John", parsed[0]["name"])
}

func TestExportToExcel(t *testing.T) {
	service := NewDataExportService(nil)

	data := []map[string]interface{}{
		{"id": "1", "name": "John", "email": "john@example.com"},
		{"id": "2", "name": "Jane", "email": "jane@example.com"},
	}

	columns := []string{"id", "name", "email"}

	result, err := service.exportToExcel(data, columns)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Greater(t, len(result), 0)
}

func TestFetchData_Users(t *testing.T) {
	service := NewDataExportService(nil)

	tenantID := uuid.New()
	filters := map[string]interface{}{
		"status": "active",
	}

	data, err := service.fetchData(context.Background(), tenantID, "users", filters)

	assert.NoError(t, err)
	assert.NotNil(t, data)
	assert.Greater(t, len(data), 0)
}

func TestFetchData_Orders(t *testing.T) {
	service := NewDataExportService(nil)

	tenantID := uuid.New()
	filters := map[string]interface{}{}

	data, err := service.fetchData(context.Background(), tenantID, "orders", filters)

	assert.NoError(t, err)
	assert.NotNil(t, data)
}

func TestFetchData_InvalidType(t *testing.T) {
	service := NewDataExportService(nil)

	tenantID := uuid.New()
	filters := map[string]interface{}{}

	_, err := service.fetchData(context.Background(), tenantID, "invalid-type", filters)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported export type")
}

func TestApplyFilters(t *testing.T) {
	service := NewDataExportService(nil)

	data := []map[string]interface{}{
		{"status": "active", "role": "admin"},
		{"status": "inactive", "role": "user"},
		{"status": "active", "role": "user"},
	}

	filters := map[string]interface{}{
		"status": "active",
	}

	result := service.applyFilters(data, filters)

	assert.Equal(t, 2, len(result))
	for _, item := range result {
		assert.Equal(t, "active", item["status"])
	}
}

func TestScheduleExport(t *testing.T) {
	mockRepo := new(MockDataExportRepository)
	service := NewDataExportService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()
	scheduledFor := time.Now().Add(1 * time.Hour)

	req := ScheduleExportRequest{
		TenantID:     tenantID,
		ExportType:   "users",
		Format:       "csv",
		ScheduledFor: scheduledFor,
		RequestedBy:  userID,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.DataExport")).Return(nil)

	export, err := service.ScheduleExport(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, export)
	assert.Equal(t, "scheduled", export.Status)
	assert.NotNil(t, export.ScheduledFor)
	mockRepo.AssertExpectations(t)
}

func stringP(s string) *string {
	return &s
}
