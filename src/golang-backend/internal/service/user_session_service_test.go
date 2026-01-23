package service

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockUserSessionRepository is a mock of UserSessionRepository
type MockUserSessionRepository struct {
	mock.Mock
}

func (m *MockUserSessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserSession, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserSession), args.Error(1)
}

func (m *MockUserSessionRepository) GetByToken(ctx context.Context, token string) (*models.UserSession, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserSession), args.Error(1)
}

func (m *MockUserSessionRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.UserSession, int64, error) {
	args := m.Called(ctx, userID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.UserSession), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserSessionRepository) Create(ctx context.Context, session *models.UserSession) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockUserSessionRepository) Update(ctx context.Context, session *models.UserSession) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockUserSessionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestUserSessionService_CreateSession(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		userID := uuid.New()
		req := CreateSessionRequest{
			UserID:    userID,
			IPAddress: "192.168.1.1",
			UserAgent: "Mozilla/5.0",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.CreateSession(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.Equal(t, userID, session.UserID)
		assert.NotEmpty(t, session.Token)
		assert.True(t, session.IsActive)
		assert.NotNil(t, session.ExpiresAt)
		assert.NotNil(t, session.IPAddress)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom expiration", func(t *testing.T) {
		req := CreateSessionRequest{
			UserID:       uuid.New(),
			IPAddress:    "10.0.0.1",
			ExpiresInSec: 3600, // 1 hour
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.CreateSession(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, session.ExpiresAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with device info", func(t *testing.T) {
		deviceID := uuid.New()
		deviceType := "mobile"
		deviceName := "iPhone 14"
		browser := "Safari"
		os := "iOS 16"
		location := "Ho Chi Minh City"

		req := CreateSessionRequest{
			UserID:     uuid.New(),
			DeviceID:   &deviceID,
			DeviceType: &deviceType,
			DeviceName: &deviceName,
			Browser:    &browser,
			OS:         &os,
			Location:   &location,
			IPAddress:  "203.162.4.190",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.CreateSession(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, &deviceID, session.DeviceID)
		assert.Equal(t, &deviceType, session.DeviceType)
		assert.Equal(t, &deviceName, session.DeviceName)
		assert.Equal(t, &browser, session.Browser)
		assert.Equal(t, &os, session.OS)
		assert.Equal(t, &location, session.Location)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateSessionRequest{
			UserID:    uuid.New(),
			IPAddress: "192.168.1.1",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserSession")).Return(errors.New("db error")).Once()

		session, err := service.CreateSession(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, session)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_GetByID(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		sessionID := uuid.New()
		expected := &models.UserSession{
			ID:       sessionID,
			UserID:   uuid.New(),
			Token:    "test-token",
			IsActive: true,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(expected, nil).Once()

		session, err := service.GetByID(ctx, sessionID)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.Equal(t, sessionID, session.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		sessionID := uuid.New()
		mockRepo.On("GetByID", ctx, sessionID).Return(nil, errors.New("not found")).Once()

		session, err := service.GetByID(ctx, sessionID)

		assert.Error(t, err)
		assert.Nil(t, session)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_GetByToken(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		token := "test-token-12345"
		expected := &models.UserSession{
			ID:       uuid.New(),
			Token:    token,
			IsActive: true,
		}

		mockRepo.On("GetByToken", ctx, token).Return(expected, nil).Once()

		session, err := service.GetByToken(ctx, token)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.Equal(t, token, session.Token)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		token := "invalid-token"
		mockRepo.On("GetByToken", ctx, token).Return(nil, errors.New("not found")).Once()

		session, err := service.GetByToken(ctx, token)

		assert.Error(t, err)
		assert.Nil(t, session)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_RevokeSession(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		sessionID := uuid.New()
		existing := &models.UserSession{
			ID:       sessionID,
			IsActive: true,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.RevokeSession(ctx, sessionID)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.False(t, session.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("session not found", func(t *testing.T) {
		sessionID := uuid.New()
		mockRepo.On("GetByID", ctx, sessionID).Return(nil, errors.New("not found")).Once()

		session, err := service.RevokeSession(ctx, sessionID)

		assert.Error(t, err)
		assert.Nil(t, session)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_RefreshSession(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		sessionID := uuid.New()
		futureTime := time.Now().Add(1 * time.Hour)
		existing := &models.UserSession{
			ID:        sessionID,
			IsActive:  true,
			ExpiresAt: &futureTime,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.RefreshSession(ctx, sessionID)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.NotNil(t, session.ExpiresAt)
		assert.True(t, session.ExpiresAt.After(time.Now()))
		mockRepo.AssertExpectations(t)
	})

	t.Run("session not active", func(t *testing.T) {
		sessionID := uuid.New()
		existing := &models.UserSession{
			ID:       sessionID,
			IsActive: false,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(existing, nil).Once()

		session, err := service.RefreshSession(ctx, sessionID)

		assert.Error(t, err)
		assert.Nil(t, session)
		assert.Contains(t, err.Error(), "not active")
		mockRepo.AssertExpectations(t)
	})

	t.Run("session expired", func(t *testing.T) {
		sessionID := uuid.New()
		pastTime := time.Now().Add(-1 * time.Hour)
		existing := &models.UserSession{
			ID:        sessionID,
			IsActive:  true,
			ExpiresAt: &pastTime,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(existing, nil).Once()

		session, err := service.RefreshSession(ctx, sessionID)

		assert.Error(t, err)
		assert.Nil(t, session)
		assert.Contains(t, err.Error(), "expired")
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_ValidateSession(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success - valid session", func(t *testing.T) {
		token := "valid-token"
		futureTime := time.Now().Add(1 * time.Hour)
		existing := &models.UserSession{
			ID:        uuid.New(),
			Token:     token,
			IsActive:  true,
			ExpiresAt: &futureTime,
		}

		mockRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.ValidateSession(ctx, token)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid token", func(t *testing.T) {
		token := "invalid-token"
		mockRepo.On("GetByToken", ctx, token).Return(nil, errors.New("not found")).Once()

		session, err := service.ValidateSession(ctx, token)

		assert.Error(t, err)
		assert.Nil(t, session)
		assert.Contains(t, err.Error(), "invalid session token")
		mockRepo.AssertExpectations(t)
	})

	t.Run("inactive session", func(t *testing.T) {
		token := "inactive-token"
		existing := &models.UserSession{
			ID:       uuid.New(),
			Token:    token,
			IsActive: false,
		}

		mockRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()

		session, err := service.ValidateSession(ctx, token)

		assert.Error(t, err)
		assert.Nil(t, session)
		assert.Contains(t, err.Error(), "not active")
		mockRepo.AssertExpectations(t)
	})

	t.Run("expired session - auto revoke", func(t *testing.T) {
		token := "expired-token"
		pastTime := time.Now().Add(-1 * time.Hour)
		existing := &models.UserSession{
			ID:        uuid.New(),
			Token:     token,
			IsActive:  true,
			ExpiresAt: &pastTime,
		}

		mockRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.ValidateSession(ctx, token)

		assert.Error(t, err)
		assert.Nil(t, session)
		assert.Contains(t, err.Error(), "expired")
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_UpdateActivity(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		sessionID := uuid.New()
		oldActivity := time.Now().Add(-1 * time.Hour)
		existing := &models.UserSession{
			ID:             sessionID,
			LastActivityAt: oldActivity,
		}

		mockRepo.On("GetByID", ctx, sessionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Once()

		session, err := service.UpdateActivity(ctx, sessionID)

		assert.NoError(t, err)
		assert.NotNil(t, session)
		assert.True(t, session.LastActivityAt.After(oldActivity))
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_GetActiveSessions(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success - filter active", func(t *testing.T) {
		userID := uuid.New()
		futureTime := time.Now().Add(1 * time.Hour)
		pastTime := time.Now().Add(-1 * time.Hour)

		sessions := []*models.UserSession{
			{ID: uuid.New(), IsActive: true, ExpiresAt: &futureTime},
			{ID: uuid.New(), IsActive: false, ExpiresAt: &futureTime},
			{ID: uuid.New(), IsActive: true, ExpiresAt: &pastTime}, // Expired
			{ID: uuid.New(), IsActive: true, ExpiresAt: nil},
		}

		mockRepo.On("ListByUser", ctx, userID, 1000, 0).Return(sessions, int64(4), nil).Once()

		active, err := service.GetActiveSessions(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, active, 2) // Only active and not expired
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		userID := uuid.New()
		mockRepo.On("ListByUser", ctx, userID, 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		active, err := service.GetActiveSessions(ctx, userID)

		assert.Error(t, err)
		assert.Nil(t, active)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_RevokeAllSessions(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		sessions := []*models.UserSession{
			{ID: uuid.New(), IsActive: true},
			{ID: uuid.New(), IsActive: true},
			{ID: uuid.New(), IsActive: false},
		}

		mockRepo.On("ListByUser", ctx, userID, 1000, 0).Return(sessions, int64(3), nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserSession")).Return(nil).Times(2)

		count, err := service.RevokeAllSessions(ctx, userID, false)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_DeleteSession(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		sessionID := uuid.New()
		mockRepo.On("Delete", ctx, sessionID).Return(nil).Once()

		err := service.DeleteSession(ctx, sessionID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		sessionID := uuid.New()
		mockRepo.On("Delete", ctx, sessionID).Return(errors.New("db error")).Once()

		err := service.DeleteSession(ctx, sessionID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_ListByUser(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.UserSession{
			{ID: uuid.New(), UserID: userID},
			{ID: uuid.New(), UserID: userID},
		}

		mockRepo.On("ListByUser", ctx, userID, 10, 0).Return(expected, int64(2), nil).Once()

		sessions, total, err := service.ListByUser(ctx, userID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, sessions, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_CleanupExpiredSessions(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		pastTime := time.Now().Add(-2 * time.Hour)
		futureTime := time.Now().Add(1 * time.Hour)

		sessions := []*models.UserSession{
			{ID: uuid.New(), ExpiresAt: &pastTime},
			{ID: uuid.New(), ExpiresAt: &futureTime},
			{ID: uuid.New(), ExpiresAt: &pastTime},
		}

		mockRepo.On("ListByUser", ctx, uuid.Nil, 10000, 0).Return(sessions, int64(3), nil).Once()
		mockRepo.On("Delete", ctx, sessions[0].ID).Return(nil).Once()
		mockRepo.On("Delete", ctx, sessions[2].ID).Return(nil).Once()

		count, err := service.CleanupExpiredSessions(ctx)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_CleanupInactiveSessions(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		oldActivity := time.Now().AddDate(0, 0, -31) // 31 days old
		recentActivity := time.Now().AddDate(0, 0, -1)

		sessions := []*models.UserSession{
			{ID: uuid.New(), LastActivityAt: oldActivity},
			{ID: uuid.New(), LastActivityAt: recentActivity},
			{ID: uuid.New(), LastActivityAt: oldActivity},
		}

		mockRepo.On("ListByUser", ctx, uuid.Nil, 10000, 0).Return(sessions, int64(3), nil).Once()
		mockRepo.On("Delete", ctx, sessions[0].ID).Return(nil).Once()
		mockRepo.On("Delete", ctx, sessions[2].ID).Return(nil).Once()

		count, err := service.CleanupInactiveSessions(ctx, 30)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_GetSessionsByDevice(t *testing.T) {
	mockRepo := new(MockUserSessionRepository)
	service := NewUserSessionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		otherDeviceID := uuid.New()

		sessions := []*models.UserSession{
			{ID: uuid.New(), DeviceID: &deviceID},
			{ID: uuid.New(), DeviceID: &otherDeviceID},
			{ID: uuid.New(), DeviceID: &deviceID},
		}

		mockRepo.On("ListByUser", ctx, uuid.Nil, 10000, 0).Return(sessions, int64(3), nil).Once()

		deviceSessions, err := service.GetSessionsByDevice(ctx, deviceID)

		assert.NoError(t, err)
		assert.Len(t, deviceSessions, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserSessionService_Helpers(t *testing.T) {
	service := NewUserSessionService(nil)

	t.Run("GetSessionDuration", func(t *testing.T) {
		createdAt := time.Now().Add(-2 * time.Hour)
		lastActivity := time.Now()
		session := &models.UserSession{
			CreatedAt:      createdAt,
			LastActivityAt: lastActivity,
		}

		duration := service.GetSessionDuration(session)
		assert.True(t, duration >= 2*time.Hour)
	})

	t.Run("IsSessionExpired - not expired", func(t *testing.T) {
		futureTime := time.Now().Add(1 * time.Hour)
		session := &models.UserSession{
			ExpiresAt: &futureTime,
		}

		expired := service.IsSessionExpired(session)
		assert.False(t, expired)
	})

	t.Run("IsSessionExpired - expired", func(t *testing.T) {
		pastTime := time.Now().Add(-1 * time.Hour)
		session := &models.UserSession{
			ExpiresAt: &pastTime,
		}

		expired := service.IsSessionExpired(session)
		assert.True(t, expired)
	})

	t.Run("IsSessionExpired - no expiration", func(t *testing.T) {
		session := &models.UserSession{
			ExpiresAt: nil,
		}

		expired := service.IsSessionExpired(session)
		assert.False(t, expired)
	})
}
