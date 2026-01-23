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

type MockNotificationRepository struct {
	mock.Mock
}

func (m *MockNotificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Notification), args.Error(1)
}

func (m *MockNotificationRepository) ListByUser(ctx context.Context, userID uuid.UUID, status string, limit, offset int) ([]*models.Notification, int64, error) {
	args := m.Called(ctx, userID, status, limit, offset)
	return args.Get(0).([]*models.Notification), args.Get(1).(int64), args.Error(2)
}

func (m *MockNotificationRepository) Create(ctx context.Context, notification *models.Notification) error {
	args := m.Called(ctx, notification)
	return args.Error(0)
}

func (m *MockNotificationRepository) Update(ctx context.Context, notification *models.Notification) error {
	args := m.Called(ctx, notification)
	return args.Error(0)
}

func (m *MockNotificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestSendNotification(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	userID := uuid.New()
	tenantID := uuid.New()

	req := SendNotificationRequest{
		UserID:   userID,
		TenantID: tenantID,
		Type:     "info",
		Channel:  "in_app",
		Title:    "Test Notification",
		Message:  "This is a test message",
		Priority: "normal",
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil)

	notification, err := service.SendNotification(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, notification)
	assert.Equal(t, "Test Notification", notification.Title)
	assert.Equal(t, "unread", notification.Status)
	assert.Equal(t, "normal", notification.Priority)
	mockRepo.AssertExpectations(t)
}

func TestSendNotification_InvalidType(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	req := SendNotificationRequest{
		UserID:   uuid.New(),
		TenantID: uuid.New(),
		Type:     "invalid-type",
		Channel:  "in_app",
		Title:    "Test",
		Message:  "Test",
	}

	_, err := service.SendNotification(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid type")
}

func TestSendNotification_InvalidChannel(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	req := SendNotificationRequest{
		UserID:   uuid.New(),
		TenantID: uuid.New(),
		Type:     "info",
		Channel:  "invalid-channel",
		Title:    "Test",
		Message:  "Test",
	}

	_, err := service.SendNotification(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid channel")
}

func TestSendNotification_Scheduled(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	futureTime := time.Now().Add(1 * time.Hour).Format(time.RFC3339)

	req := SendNotificationRequest{
		UserID:       uuid.New(),
		TenantID:     uuid.New(),
		Type:         "info",
		Channel:      "in_app",
		Title:        "Scheduled Notification",
		Message:      "This is scheduled",
		ScheduledFor: &futureTime,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil)

	notification, err := service.SendNotification(context.Background(), req)

	assert.NoError(t, err)
	assert.Equal(t, "scheduled", notification.Status)
	assert.NotNil(t, notification.ScheduledFor)
	mockRepo.AssertExpectations(t)
}

func TestMarkAsRead(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	notificationID := uuid.New()
	notification := &models.Notification{
		ID:     notificationID,
		Status: "unread",
	}

	mockRepo.On("GetByID", mock.Anything, notificationID).Return(notification, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil)

	result, err := service.MarkAsRead(context.Background(), notificationID)

	assert.NoError(t, err)
	assert.Equal(t, "read", result.Status)
	assert.NotNil(t, result.ReadAt)
	mockRepo.AssertExpectations(t)
}

func TestMarkAsRead_AlreadyRead(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	notificationID := uuid.New()
	readAt := time.Now()
	notification := &models.Notification{
		ID:     notificationID,
		Status: "read",
		ReadAt: &readAt,
	}

	mockRepo.On("GetByID", mock.Anything, notificationID).Return(notification, nil)

	result, err := service.MarkAsRead(context.Background(), notificationID)

	assert.NoError(t, err)
	assert.Equal(t, "read", result.Status)
	mockRepo.AssertExpectations(t)
}

func TestMarkAllAsRead(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	userID := uuid.New()
	notifications := []*models.Notification{
		{ID: uuid.New(), Status: "unread"},
		{ID: uuid.New(), Status: "unread"},
		{ID: uuid.New(), Status: "unread"},
	}

	mockRepo.On("ListByUser", mock.Anything, userID, "unread", 10000, 0).Return(notifications, int64(3), nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil).Times(3)

	count, err := service.MarkAllAsRead(context.Background(), userID)

	assert.NoError(t, err)
	assert.Equal(t, 3, count)
	mockRepo.AssertExpectations(t)
}

func TestArchiveNotification(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	notificationID := uuid.New()
	notification := &models.Notification{
		ID:     notificationID,
		Status: "read",
	}

	mockRepo.On("GetByID", mock.Anything, notificationID).Return(notification, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil)

	result, err := service.ArchiveNotification(context.Background(), notificationID)

	assert.NoError(t, err)
	assert.Equal(t, "archived", result.Status)
	assert.NotNil(t, result.ArchivedAt)
	mockRepo.AssertExpectations(t)
}

func TestSendBulkNotification(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	userIDs := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}

	req := SendBulkNotificationRequest{
		UserIDs:  userIDs,
		TenantID: uuid.New(),
		Type:     "info",
		Channel:  "in_app",
		Title:    "Bulk Notification",
		Message:  "This is a bulk message",
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Notification")).Return(nil).Times(3)

	count, err := service.SendBulkNotification(context.Background(), req)

	assert.NoError(t, err)
	assert.Equal(t, 3, count)
	mockRepo.AssertExpectations(t)
}

func TestDeleteAllNotifications(t *testing.T) {
	mockRepo := new(MockNotificationRepository)
	service := NewNotificationService(mockRepo, nil, nil)

	userID := uuid.New()
	notifications := []*models.Notification{
		{ID: uuid.New()},
		{ID: uuid.New()},
	}

	mockRepo.On("ListByUser", mock.Anything, userID, "", 10000, 0).Return(notifications, int64(2), nil)
	mockRepo.On("Delete", mock.Anything, mock.AnythingOfType("uuid.UUID")).Return(nil).Times(2)

	count, err := service.DeleteAllNotifications(context.Background(), userID)

	assert.NoError(t, err)
	assert.Equal(t, 2, count)
	mockRepo.AssertExpectations(t)
}
