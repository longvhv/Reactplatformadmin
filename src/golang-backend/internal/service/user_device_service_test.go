package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockUserDeviceRepository is a mock of UserDeviceRepository
type MockUserDeviceRepository struct {
	mock.Mock
}

func (m *MockUserDeviceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserDevice), args.Error(1)
}

func (m *MockUserDeviceRepository) GetByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*models.UserDevice, error) {
	args := m.Called(ctx, userID, fingerprint)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserDevice), args.Error(1)
}

func (m *MockUserDeviceRepository) ListByUser(ctx context.Context, userID uuid.UUID, status string, limit, offset int) ([]*models.UserDevice, int64, error) {
	args := m.Called(ctx, userID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.UserDevice), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserDeviceRepository) Create(ctx context.Context, device *models.UserDevice) error {
	args := m.Called(ctx, device)
	return args.Error(0)
}

func (m *MockUserDeviceRepository) Update(ctx context.Context, device *models.UserDevice) error {
	args := m.Called(ctx, device)
	return args.Error(0)
}

func (m *MockUserDeviceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestUserDeviceService_RegisterDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success - new device", func(t *testing.T) {
		userID := uuid.New()
		req := RegisterDeviceRequest{
			UserID:     userID,
			DeviceType: "mobile",
			IPAddress:  "192.168.1.1",
			UserAgent:  "Mozilla/5.0",
		}

		mockRepo.On("GetByFingerprint", ctx, userID, mock.Anything).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.RegisterDevice(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.Equal(t, "mobile", device.DeviceType)
		assert.Equal(t, "active", device.Status)
		assert.False(t, device.IsTrusted)
		assert.Equal(t, 1, device.LoginCount)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - existing device", func(t *testing.T) {
		userID := uuid.New()
		pushToken := "new-push-token"
		req := RegisterDeviceRequest{
			UserID:     userID,
			DeviceType: "mobile",
			IPAddress:  "192.168.1.1",
			UserAgent:  "Mozilla/5.0",
			PushToken:  &pushToken,
		}

		existing := &models.UserDevice{
			ID:         uuid.New(),
			UserID:     userID,
			LoginCount: 5,
			PushToken:  nil,
		}

		mockRepo.On("GetByFingerprint", ctx, userID, mock.Anything).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.RegisterDevice(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.Equal(t, 6, device.LoginCount)
		assert.Equal(t, &pushToken, device.PushToken)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with full details", func(t *testing.T) {
		deviceName := "iPhone 14 Pro"
		deviceModel := "iPhone14,3"
		manufacturer := "Apple"
		os := "iOS"
		osVersion := "16.3"
		browser := "Safari"
		browserVersion := "16.3"
		appName := "MyApp"
		appVersion := "2.1.0"
		pushToken := "fcm-token-12345"

		req := RegisterDeviceRequest{
			UserID:         uuid.New(),
			DeviceType:     "mobile",
			DeviceName:     &deviceName,
			DeviceModel:    &deviceModel,
			Manufacturer:   &manufacturer,
			OS:             &os,
			OSVersion:      &osVersion,
			Browser:        &browser,
			BrowserVersion: &browserVersion,
			AppName:        &appName,
			AppVersion:     &appVersion,
			IPAddress:      "203.162.4.190",
			UserAgent:      "MyApp/2.1.0",
			Location:       map[string]interface{}{"city": "Ho Chi Minh City"},
			PushToken:      &pushToken,
			Metadata:       map[string]interface{}{"custom": "data"},
		}

		mockRepo.On("GetByFingerprint", ctx, req.UserID, mock.Anything).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.RegisterDevice(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, &deviceName, device.DeviceName)
		assert.Equal(t, &deviceModel, device.DeviceModel)
		assert.Equal(t, &manufacturer, device.Manufacturer)
		assert.Equal(t, &os, device.OS)
		assert.Equal(t, &pushToken, device.PushToken)
		assert.NotNil(t, device.Location)
		assert.NotNil(t, device.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid device type", func(t *testing.T) {
		req := RegisterDeviceRequest{
			UserID:     uuid.New(),
			DeviceType: "invalid-type",
			IPAddress:  "192.168.1.1",
			UserAgent:  "Test",
		}

		device, err := service.RegisterDevice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, device)
		assert.Contains(t, err.Error(), "invalid device type")
	})

	t.Run("repository error on create", func(t *testing.T) {
		req := RegisterDeviceRequest{
			UserID:     uuid.New(),
			DeviceType: "mobile",
			IPAddress:  "192.168.1.1",
			UserAgent:  "Test",
		}

		mockRepo.On("GetByFingerprint", ctx, req.UserID, mock.Anything).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDevice")).Return(errors.New("db error")).Once()

		device, err := service.RegisterDevice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, device)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_UpdateDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		existing := &models.UserDevice{
			ID:         deviceID,
			DeviceName: nil,
			PushToken:  nil,
		}

		newName := "My iPhone"
		newToken := "new-token"
		req := UpdateDeviceRequest{
			DeviceName: &newName,
			PushToken:  &newToken,
			Location:   map[string]interface{}{"country": "Vietnam"},
			Metadata:   map[string]interface{}{"key": "value"},
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.UpdateDevice(ctx, deviceID, req)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.Equal(t, &newName, device.DeviceName)
		assert.Equal(t, &newToken, device.PushToken)
		mockRepo.AssertExpectations(t)
	})

	t.Run("device not found", func(t *testing.T) {
		deviceID := uuid.New()
		req := UpdateDeviceRequest{}

		mockRepo.On("GetByID", ctx, deviceID).Return(nil, errors.New("not found")).Once()

		device, err := service.UpdateDevice(ctx, deviceID, req)

		assert.Error(t, err)
		assert.Nil(t, device)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_RevokeDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		existing := &models.UserDevice{
			ID:     deviceID,
			Status: "active",
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.RevokeDevice(ctx, deviceID, "security_concern")

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.Equal(t, "revoked", device.Status)
		assert.NotNil(t, device.RevokedAt)
		assert.NotNil(t, device.RevokedReason)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without reason", func(t *testing.T) {
		deviceID := uuid.New()
		existing := &models.UserDevice{
			ID:     deviceID,
			Status: "active",
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.RevokeDevice(ctx, deviceID, "")

		assert.NoError(t, err)
		assert.Equal(t, "revoked", device.Status)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_TrustDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		existing := &models.UserDevice{
			ID:        deviceID,
			IsTrusted: false,
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.TrustDevice(ctx, deviceID)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.True(t, device.IsTrusted)
		mockRepo.AssertExpectations(t)
	})

	t.Run("device not found", func(t *testing.T) {
		deviceID := uuid.New()
		mockRepo.On("GetByID", ctx, deviceID).Return(nil, errors.New("not found")).Once()

		device, err := service.TrustDevice(ctx, deviceID)

		assert.Error(t, err)
		assert.Nil(t, device)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_UntrustDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		existing := &models.UserDevice{
			ID:        deviceID,
			IsTrusted: true,
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.UntrustDevice(ctx, deviceID)

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.False(t, device.IsTrusted)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_UpdateActivity(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		oldTime := time.Now().Add(-1 * time.Hour)
		existing := &models.UserDevice{
			ID:         deviceID,
			LastUsedAt: oldTime,
			LoginCount: 5,
		}

		mockRepo.On("GetByID", ctx, deviceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Once()

		device, err := service.UpdateActivity(ctx, deviceID, "203.162.4.190")

		assert.NoError(t, err)
		assert.NotNil(t, device)
		assert.True(t, device.LastUsedAt.After(oldTime))
		assert.Equal(t, 6, device.LoginCount)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_GetTrustedDevices(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		devices := []*models.UserDevice{
			{ID: uuid.New(), IsTrusted: true, Status: "active"},
			{ID: uuid.New(), IsTrusted: false, Status: "active"},
			{ID: uuid.New(), IsTrusted: true, Status: "revoked"},
			{ID: uuid.New(), IsTrusted: true, Status: "active"},
		}

		mockRepo.On("ListByUser", ctx, userID, "", 1000, 0).Return(devices, int64(4), nil).Once()

		trusted, err := service.GetTrustedDevices(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, trusted, 2) // Only active and trusted
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_RevokeAllDevices(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		devices := []*models.UserDevice{
			{ID: uuid.New(), Status: "active"},
			{ID: uuid.New(), Status: "active"},
			{ID: uuid.New(), Status: "revoked"},
		}

		mockRepo.On("ListByUser", ctx, userID, "", 1000, 0).Return(devices, int64(3), nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Times(2)

		count, err := service.RevokeAllDevices(ctx, userID, false, "security_breach")

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_CleanupInactiveDevices(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		oldTime := time.Now().AddDate(0, 0, -31)
		recentTime := time.Now().AddDate(0, 0, -1)

		devices := []*models.UserDevice{
			{ID: uuid.New(), LastUsedAt: oldTime, Status: "active"},
			{ID: uuid.New(), LastUsedAt: recentTime, Status: "active"},
			{ID: uuid.New(), LastUsedAt: oldTime, Status: "active"},
		}

		mockRepo.On("ListByUser", ctx, uuid.Nil, "", 10000, 0).Return(devices, int64(3), nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDevice")).Return(nil).Times(2)

		count, err := service.CleanupInactiveDevices(ctx, 30)

		assert.NoError(t, err)
		assert.Equal(t, 2, count)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_ListByUser(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.UserDevice{
			{ID: uuid.New(), UserID: userID},
			{ID: uuid.New(), UserID: userID},
		}

		mockRepo.On("ListByUser", ctx, userID, "", 10, 0).Return(expected, int64(2), nil).Once()

		devices, total, err := service.ListByUser(ctx, userID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, devices, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with status filter", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.UserDevice{
			{ID: uuid.New(), Status: "active"},
		}

		mockRepo.On("ListByUser", ctx, userID, "active", 10, 0).Return(expected, int64(1), nil).Once()

		devices, total, err := service.ListByUser(ctx, userID, "active", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, devices, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDeviceService_DeleteDevice(t *testing.T) {
	mockRepo := new(MockUserDeviceRepository)
	service := NewUserDeviceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		deviceID := uuid.New()
		mockRepo.On("Delete", ctx, deviceID).Return(nil).Once()

		err := service.DeleteDevice(ctx, deviceID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		deviceID := uuid.New()
		mockRepo.On("Delete", ctx, deviceID).Return(errors.New("db error")).Once()

		err := service.DeleteDevice(ctx, deviceID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}
