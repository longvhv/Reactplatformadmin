package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockAuditLogRepository is a mock of AuditLogRepository
type MockAuditLogRepository struct {
	mock.Mock
}

func (m *MockAuditLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) List(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, resource, status *string, startTime, endTime *time.Time) ([]*models.AuditLog, int, error) {
	args := m.Called(ctx, page, pageSize, tenantID, userID, action, resource, status, startTime, endTime)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.AuditLog), args.Int(1), args.Error(2)
}

func (m *MockAuditLogRepository) ListByTenantID(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	args := m.Called(ctx, tenantID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) ListByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	args := m.Called(ctx, userID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) ListByResource(ctx context.Context, resource string, resourceID string) ([]*models.AuditLog, error) {
	args := m.Called(ctx, resource, resourceID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) ListByAction(ctx context.Context, action string) ([]*models.AuditLog, error) {
	args := m.Called(ctx, action)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) ListByIPAddress(ctx context.Context, ipAddress string) ([]*models.AuditLog, error) {
	args := m.Called(ctx, ipAddress)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuditLog), args.Error(1)
}

func (m *MockAuditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockAuditLogRepository) DeleteOldLogs(ctx context.Context, olderThan time.Time) (int64, error) {
	args := m.Called(ctx, olderThan)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockAuditLogRepository) GetStatsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	args := m.Called(ctx, tenantID, startTime, endTime)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockAuditLogRepository) GetStatsByUser(ctx context.Context, userID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	args := m.Called(ctx, userID, startTime, endTime)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func TestAuditLogService_CreateLog(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success with minimal data", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		req := &models.CreateAuditLogRequest{
			TenantID: &tenantID,
			UserID:   &userID,
			Action:   "user.login",
			Resource: "user",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuditLog")).Return(nil).Once()

		log, err := service.CreateLog(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, log)
		assert.True(t, log.TenantID.Valid)
		assert.True(t, log.UserID.Valid)
		assert.True(t, log.Action.Valid)
		assert.Equal(t, "user.login", log.Action.String)
		assert.Equal(t, "success", log.Status.String) // Default status
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full data", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		impersonatorID := uuid.New()
		req := &models.CreateAuditLogRequest{
			TenantID:       &tenantID,
			UserID:         &userID,
			ImpersonatorID: &impersonatorID,
			Action:         "tenant.update",
			Resource:       "tenant",
			ResourceID:     "tenant-123",
			IPAddress:      "192.168.1.100",
			UserAgent:      "Mozilla/5.0",
			Status:         "success",
			Details: map[string]interface{}{
				"field":     "name",
				"old_value": "Old Name",
				"new_value": "New Name",
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuditLog")).Return(nil).Once()

		log, err := service.CreateLog(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, log)
		assert.True(t, log.ImpersonatorID.Valid)
		assert.True(t, log.ResourceID.Valid)
		assert.True(t, log.IPAddress.Valid)
		assert.True(t, log.UserAgent.Valid)
		assert.NotNil(t, log.Details)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with failure status", func(t *testing.T) {
		tenantID := uuid.New()
		req := &models.CreateAuditLogRequest{
			TenantID: &tenantID,
			Action:   "user.delete",
			Status:   "failure",
			Details: map[string]interface{}{
				"error": "Permission denied",
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuditLog")).Return(nil).Once()

		log, err := service.CreateLog(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "failure", log.Status.String)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateAuditLogRequest{
			Action: "test.action",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuditLog")).Return(errors.New("db error")).Once()

		log, err := service.CreateLog(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, log)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_GetLog(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		logID := uuid.New()
		expected := &models.AuditLog{
			ID: logID,
		}

		mockRepo.On("GetByID", ctx, logID).Return(expected, nil).Once()

		log, err := service.GetLog(ctx, logID)

		assert.NoError(t, err)
		assert.NotNil(t, log)
		assert.Equal(t, logID, log.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		logID := uuid.New()
		mockRepo.On("GetByID", ctx, logID).Return(nil, errors.New("not found")).Once()

		log, err := service.GetLog(ctx, logID)

		assert.Error(t, err)
		assert.Nil(t, log)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogs(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.AuditLog{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 50, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil), (*string)(nil), (*string)(nil), (*time.Time)(nil), (*time.Time)(nil)).
			Return(expected, 2, nil).Once()

		logs, total, err := service.ListLogs(ctx, 1, 50, nil, nil, nil, nil, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, logs, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with tenant filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 50, &tenantID, (*uuid.UUID)(nil), (*string)(nil), (*string)(nil), (*string)(nil), (*time.Time)(nil), (*time.Time)(nil)).
			Return(expected, 1, nil).Once()

		logs, total, err := service.ListLogs(ctx, 1, 50, &tenantID, nil, nil, nil, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with action and status filter", func(t *testing.T) {
		action := "user.login"
		status := "success"
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 50, (*uuid.UUID)(nil), (*uuid.UUID)(nil), &action, (*string)(nil), &status, (*time.Time)(nil), (*time.Time)(nil)).
			Return(expected, 1, nil).Once()

		logs, total, err := service.ListLogs(ctx, 1, 50, nil, nil, &action, nil, &status, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with time range", func(t *testing.T) {
		startTime := time.Now().Add(-24 * time.Hour)
		endTime := time.Now()
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 50, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil), (*string)(nil), (*string)(nil), &startTime, &endTime).
			Return(expected, 1, nil).Once()

		logs, total, err := service.ListLogs(ctx, 1, 50, nil, nil, nil, nil, nil, &startTime, &endTime)

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct page and page size", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 50, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil), (*string)(nil), (*string)(nil), (*time.Time)(nil), (*time.Time)(nil)).
			Return([]*models.AuditLog{}, 0, nil).Once()

		// Invalid page/size should be corrected
		_, _, err := service.ListLogs(ctx, 0, 200, nil, nil, nil, nil, nil, nil, nil)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogsByTenant(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.AuditLog{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("ListByTenantID", ctx, tenantID, 100).Return(expected, nil).Once()

		logs, err := service.ListLogsByTenant(ctx, tenantID, 100)

		assert.NoError(t, err)
		assert.Len(t, logs, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct limit", func(t *testing.T) {
		tenantID := uuid.New()
		mockRepo.On("ListByTenantID", ctx, tenantID, 100).Return([]*models.AuditLog{}, nil).Once()

		_, err := service.ListLogsByTenant(ctx, tenantID, 2000) // Too high

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogsByUser(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("ListByUserID", ctx, userID, 50).Return(expected, nil).Once()

		logs, err := service.ListLogsByUser(ctx, userID, 50)

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogsByResource(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("ListByResource", ctx, "tenant", "tenant-123").Return(expected, nil).Once()

		logs, err := service.ListLogsByResource(ctx, "tenant", "tenant-123")

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogsByAction(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("ListByAction", ctx, "user.login").Return(expected, nil).Once()

		logs, err := service.ListLogsByAction(ctx, "user.login")

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_ListLogsByIPAddress(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := []*models.AuditLog{
			{ID: uuid.New()},
		}

		mockRepo.On("ListByIPAddress", ctx, "192.168.1.100").Return(expected, nil).Once()

		logs, err := service.ListLogsByIPAddress(ctx, "192.168.1.100")

		assert.NoError(t, err)
		assert.Len(t, logs, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_DeleteOldLogs(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("DeleteOldLogs", ctx, mock.AnythingOfType("time.Time")).Return(int64(150), nil).Once()

		count, err := service.DeleteOldLogs(ctx, 90)

		assert.NoError(t, err)
		assert.Equal(t, int64(150), count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid days", func(t *testing.T) {
		count, err := service.DeleteOldLogs(ctx, 0)

		assert.Error(t, err)
		assert.Equal(t, int64(0), count)
		assert.Contains(t, err.Error(), "days must be at least 1")
	})
}

func TestAuditLogService_GetStatsByTenant(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		startTime := time.Now().Add(-30 * 24 * time.Hour)
		endTime := time.Now()

		expected := map[string]interface{}{
			"total_events":   1500,
			"success_rate":   0.95,
			"top_actions":    []string{"user.login", "tenant.update"},
			"top_users":      []string{"user-1", "user-2"},
		}

		mockRepo.On("GetStatsByTenant", ctx, tenantID, startTime, endTime).Return(expected, nil).Once()

		stats, err := service.GetStatsByTenant(ctx, tenantID, startTime, endTime)

		assert.NoError(t, err)
		assert.NotNil(t, stats)
		assert.Equal(t, 1500, stats["total_events"])
		mockRepo.AssertExpectations(t)
	})
}

func TestAuditLogService_GetStatsByUser(t *testing.T) {
	mockRepo := new(MockAuditLogRepository)
	service := NewAuditLogService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		startTime := time.Now().Add(-7 * 24 * time.Hour)
		endTime := time.Now()

		expected := map[string]interface{}{
			"total_actions":   250,
			"success_count":   240,
			"failure_count":   10,
			"most_used_ip":    "192.168.1.100",
		}

		mockRepo.On("GetStatsByUser", ctx, userID, startTime, endTime).Return(expected, nil).Once()

		stats, err := service.GetStatsByUser(ctx, userID, startTime, endTime)

		assert.NoError(t, err)
		assert.NotNil(t, stats)
		assert.Equal(t, 250, stats["total_actions"])
		mockRepo.AssertExpectations(t)
	})
}
