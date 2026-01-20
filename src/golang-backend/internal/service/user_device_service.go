package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

// UserDeviceService defines the interface for user device business logic
type UserDeviceService interface {
	RegisterDevice(ctx context.Context, req *models.CreateUserDeviceRequest) (*models.UserDevice, error)
	GetDevice(ctx context.Context, id uuid.UUID) (*models.UserDevice, error)
	GetDeviceByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*models.UserDevice, error)
	ListDevices(ctx context.Context, page, pageSize int, userID *uuid.UUID, status *string, deviceType *string) ([]*models.UserDevice, int, error)
	ListDevicesByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]*models.UserDevice, int, error)
	UpdateDevice(ctx context.Context, id uuid.UUID, req *models.UpdateUserDeviceRequest) (*models.UserDevice, error)
	DeleteDevice(ctx context.Context, id uuid.UUID) error
	UpdateDeviceActivity(ctx context.Context, id uuid.UUID) error
	TrustDevice(ctx context.Context, id uuid.UUID) error
	UntrustDevice(ctx context.Context, id uuid.UUID) error
	RevokeDevice(ctx context.Context, id uuid.UUID, reason string) error
	GetActiveDevicesCount(ctx context.Context, userID uuid.UUID) (int, error)
	ListTrustedDevices(ctx context.Context, userID uuid.UUID) ([]*models.UserDevice, error)
}

type userDeviceService struct {
	repo repository.UserDeviceRepository
}

// NewUserDeviceService creates a new user device service
func NewUserDeviceService(repo repository.UserDeviceRepository) UserDeviceService {
	return &userDeviceService{repo: repo}
}

// RegisterDevice registers a new device for a user
func (s *userDeviceService) RegisterDevice(ctx context.Context, req *models.CreateUserDeviceRequest) (*models.UserDevice, error) {
	// Check if device with same fingerprint exists
	if req.Fingerprint != "" {
		existingDevice, err := s.repo.GetByFingerprint(ctx, req.UserID, req.Fingerprint)
		if err == nil && existingDevice != nil {
			// Update existing device activity
			if err := s.repo.UpdateActivity(ctx, existingDevice.ID); err != nil {
				return nil, fmt.Errorf("failed to update device activity: %w", err)
			}
			return s.repo.GetByID(ctx, existingDevice.ID)
		}
	}

	now := time.Now()
	device := &models.UserDevice{
		ID:          uuid.New(),
		UserID:      req.UserID,
		DeviceType:  req.DeviceType,
		IsTrusted:   false,
		FirstSeenAt: now,
		LastUsedAt:  now,
		LoginCount:  1,
		Status:      "active",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Set optional fields
	if req.DeviceName != "" {
		device.DeviceName.String = req.DeviceName
		device.DeviceName.Valid = true
	}
	if req.DeviceModel != "" {
		device.DeviceModel.String = req.DeviceModel
		device.DeviceModel.Valid = true
	}
	if req.Manufacturer != "" {
		device.Manufacturer.String = req.Manufacturer
		device.Manufacturer.Valid = true
	}
	if req.OS != "" {
		device.OS.String = req.OS
		device.OS.Valid = true
	}
	if req.OSVersion != "" {
		device.OSVersion.String = req.OSVersion
		device.OSVersion.Valid = true
	}
	if req.Browser != "" {
		device.Browser.String = req.Browser
		device.Browser.Valid = true
	}
	if req.BrowserVersion != "" {
		device.BrowserVersion.String = req.BrowserVersion
		device.BrowserVersion.Valid = true
	}
	if req.AppName != "" {
		device.AppName.String = req.AppName
		device.AppName.Valid = true
	}
	if req.AppVersion != "" {
		device.AppVersion.String = req.AppVersion
		device.AppVersion.Valid = true
	}
	if req.IPAddress != "" {
		device.IPAddress.String = req.IPAddress
		device.IPAddress.Valid = true
	}
	if req.UserAgent != "" {
		device.UserAgent.String = req.UserAgent
		device.UserAgent.Valid = true
	}
	if req.Fingerprint != "" {
		device.Fingerprint.String = req.Fingerprint
		device.Fingerprint.Valid = true
	}
	if req.PushToken != "" {
		device.PushToken.String = req.PushToken
		device.PushToken.Valid = true
	}

	// Set location JSONB
	if req.Location != nil {
		locationJSON, err := json.Marshal(req.Location)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal location: %w", err)
		}
		device.Location = locationJSON
	} else {
		device.Location = []byte("{}")
	}

	// Set metadata
	device.Metadata = []byte("{}")

	if err := s.repo.Create(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to register device: %w", err)
	}

	return device, nil
}

// GetDevice gets a device by ID
func (s *userDeviceService) GetDevice(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	return s.repo.GetByID(ctx, id)
}

// GetDeviceByFingerprint gets a device by user ID and fingerprint
func (s *userDeviceService) GetDeviceByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*models.UserDevice, error) {
	return s.repo.GetByFingerprint(ctx, userID, fingerprint)
}

// ListDevices lists devices with pagination and filters
func (s *userDeviceService) ListDevices(ctx context.Context, page, pageSize int, userID *uuid.UUID, status *string, deviceType *string) ([]*models.UserDevice, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, userID, status, deviceType)
}

// ListDevicesByUser lists devices for a specific user
func (s *userDeviceService) ListDevicesByUser(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]*models.UserDevice, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.ListByUserID(ctx, userID, page, pageSize)
}

// UpdateDevice updates a device
func (s *userDeviceService) UpdateDevice(ctx context.Context, id uuid.UUID, req *models.UpdateUserDeviceRequest) (*models.UserDevice, error) {
	device, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.DeviceName != nil {
		if *req.DeviceName == "" {
			device.DeviceName.Valid = false
		} else {
			device.DeviceName.String = *req.DeviceName
			device.DeviceName.Valid = true
		}
	}
	if req.IsTrusted != nil {
		device.IsTrusted = *req.IsTrusted
	}
	if req.PushToken != nil {
		if *req.PushToken == "" {
			device.PushToken.Valid = false
		} else {
			device.PushToken.String = *req.PushToken
			device.PushToken.Valid = true
		}
	}
	if req.Status != nil {
		device.Status = *req.Status
	}
	if req.RevokedAt != nil {
		revokedTime, err := time.Parse(time.RFC3339, *req.RevokedAt)
		if err == nil {
			device.RevokedAt.Time = revokedTime
			device.RevokedAt.Valid = true
		}
	}
	if req.RevokedReason != nil {
		if *req.RevokedReason == "" {
			device.RevokedReason.Valid = false
		} else {
			device.RevokedReason.String = *req.RevokedReason
			device.RevokedReason.Valid = true
		}
	}

	device.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to update device: %w", err)
	}

	return device, nil
}

// DeleteDevice deletes a device
func (s *userDeviceService) DeleteDevice(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// UpdateDeviceActivity updates device activity (last used, login count)
func (s *userDeviceService) UpdateDeviceActivity(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateActivity(ctx, id)
}

// TrustDevice marks a device as trusted
func (s *userDeviceService) TrustDevice(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateTrustStatus(ctx, id, true)
}

// UntrustDevice marks a device as untrusted
func (s *userDeviceService) UntrustDevice(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateTrustStatus(ctx, id, false)
}

// RevokeDevice revokes a device
func (s *userDeviceService) RevokeDevice(ctx context.Context, id uuid.UUID, reason string) error {
	return s.repo.RevokeDevice(ctx, id, reason)
}

// GetActiveDevicesCount gets the count of active devices for a user
func (s *userDeviceService) GetActiveDevicesCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.repo.GetActiveDevicesCount(ctx, userID)
}

// ListTrustedDevices lists trusted devices for a user
func (s *userDeviceService) ListTrustedDevices(ctx context.Context, userID uuid.UUID) ([]*models.UserDevice, error) {
	return s.repo.ListTrustedDevices(ctx, userID)
}
