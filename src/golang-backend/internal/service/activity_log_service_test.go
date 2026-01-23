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

type MockActivityLogRepository struct {
	mock.Mock
}

func (m *MockActivityLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ActivityLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ActivityLog), args.Error(1)
}

func (m *MockActivityLogRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, activityType, entityType string, limit, offset int) ([]*models.ActivityLog, int64, error) {
	args := m.Called(ctx, tenantID, activityType, entityType, limit, offset)
	return args.Get(0).([]*models.ActivityLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockActivityLogRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.ActivityLog, int64, error) {
	args := m.Called(ctx, userID, limit, offset)
	return args.Get(0).([]*models.ActivityLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockActivityLogRepository) GetByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]*models.ActivityLog, int64, error) {
	args := m.Called(ctx, entityType, entityID, limit, offset)
	return args.Get(0).([]*models.ActivityLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockActivityLogRepository) Create(ctx context.Context, log *models.ActivityLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func TestLogActivity(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()

	req := LogActivityRequest{
		TenantID:     tenantID,
		UserID:       &userID,
		ActivityType: "user",
		Action:       "login",
		Description:  strP("User logged in"),
		IPAddress:    strP("192.168.1.1"),
		Severity:     strP("info"),
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.ActivityLog")).Return(nil)

	log, err := service.LogActivity(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, log)
	assert.Equal(t, "user", log.ActivityType)
	assert.Equal(t, "login", log.Action)
	assert.Equal(t, "info", log.Severity)
	mockRepo.AssertExpectations(t)
}

func TestLogActivity_InvalidType(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	req := LogActivityRequest{
		TenantID:     uuid.New(),
		ActivityType: "invalid-type",
		Action:       "test",
	}

	_, err := service.LogActivity(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid activity type")
}

func TestGetByUser(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	userID := uuid.New()
	logs := []*models.ActivityLog{
		{ID: uuid.New(), Action: "login"},
		{ID: uuid.New(), Action: "logout"},
	}

	mockRepo.On("GetByUser", mock.Anything, userID, 50, 0).Return(logs, int64(2), nil)

	result, total, err := service.GetByUser(context.Background(), userID, 1, 50)

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, int64(2), total)
	mockRepo.AssertExpectations(t)
}

func TestGetByEntity(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	entityID := uuid.New()
	logs := []*models.ActivityLog{
		{ID: uuid.New(), Action: "created"},
		{ID: uuid.New(), Action: "updated"},
	}

	mockRepo.On("GetByEntity", mock.Anything, "user", entityID, 50, 0).Return(logs, int64(2), nil)

	result, total, err := service.GetByEntity(context.Background(), "user", entityID, 1, 50)

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, int64(2), total)
	mockRepo.AssertExpectations(t)
}

func TestSearch(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()
	activityType := "user"

	logs := []*models.ActivityLog{
		{
			ID:           uuid.New(),
			UserID:       &userID,
			ActivityType: "user",
			Action:       "login",
			Timestamp:    time.Now(),
		},
	}

	req := SearchActivityRequest{
		TenantID:     tenantID,
		UserID:       &userID,
		ActivityType: &activityType,
		Page:         1,
		Limit:        50,
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, activityType, "", 50, 0).Return(logs, int64(1), nil)

	result, total, err := service.Search(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1), total)
	mockRepo.AssertExpectations(t)
}

func TestGetStats(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	logs := []*models.ActivityLog{
		{ActivityType: "user", Action: "login", Severity: "info"},
		{ActivityType: "user", Action: "logout", Severity: "info"},
		{ActivityType: "security", Action: "failed_login", Severity: "warning"},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(logs, int64(3), nil)

	stats, err := service.GetStats(context.Background(), tenantID, "", "")

	assert.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 3, stats["total_activities"])
	
	byType := stats["by_type"].(map[string]int)
	assert.Equal(t, 2, byType["user"])
	assert.Equal(t, 1, byType["security"])
	
	bySeverity := stats["by_severity"].(map[string]int)
	assert.Equal(t, 2, bySeverity["info"])
	assert.Equal(t, 1, bySeverity["warning"])
	
	mockRepo.AssertExpectations(t)
}

func TestGetTimeline(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	now := time.Now()
	
	logs := []*models.ActivityLog{
		{ID: uuid.New(), ActivityType: "user", Action: "login", Timestamp: now},
		{ID: uuid.New(), ActivityType: "user", Action: "logout", Timestamp: now.Add(-1 * time.Hour)},
		{ID: uuid.New(), ActivityType: "security", Action: "alert", Timestamp: now.Add(-25 * time.Hour)},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(logs, int64(3), nil)

	timeline, err := service.GetTimeline(context.Background(), tenantID, 7)

	assert.NoError(t, err)
	assert.NotNil(t, timeline)
	// Should only include activities within 7 days
	assert.GreaterOrEqual(t, len(timeline), 1)
	mockRepo.AssertExpectations(t)
}

func TestExport_CSV(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()
	entityType := "user"
	entityID := uuid.New()
	
	logs := []*models.ActivityLog{
		{
			ID:           uuid.New(),
			UserID:       &userID,
			ActivityType: "user",
			Action:       "login",
			EntityType:   &entityType,
			EntityID:     &entityID,
			Severity:     "info",
			Description:  strP("User logged in"),
			Timestamp:    time.Now(),
		},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(logs, int64(1), nil)

	data, fileName, err := service.Export(context.Background(), tenantID, "csv", "", "")

	assert.NoError(t, err)
	assert.NotNil(t, data)
	assert.Contains(t, fileName, ".csv")
	assert.Contains(t, string(data), "ID,Timestamp")
	mockRepo.AssertExpectations(t)
}

func TestExport_JSON(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	logs := []*models.ActivityLog{
		{
			ID:           uuid.New(),
			ActivityType: "user",
			Action:       "login",
			Severity:     "info",
			Timestamp:    time.Now(),
		},
	}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(logs, int64(1), nil)

	data, fileName, err := service.Export(context.Background(), tenantID, "json", "", "")

	assert.NoError(t, err)
	assert.NotNil(t, data)
	assert.Contains(t, fileName, ".json")
	assert.Contains(t, string(data), "activity_type")
	mockRepo.AssertExpectations(t)
}

func TestExport_UnsupportedFormat(t *testing.T) {
	mockRepo := new(MockActivityLogRepository)
	service := NewActivityLogService(mockRepo)

	tenantID := uuid.New()
	logs := []*models.ActivityLog{}

	mockRepo.On("ListByTenant", mock.Anything, tenantID, "", "", 100000, 0).Return(logs, int64(0), nil)

	_, _, err := service.Export(context.Background(), tenantID, "pdf", "", "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported format")
	mockRepo.AssertExpectations(t)
}

func strP(s string) *string {
	return &s
}
