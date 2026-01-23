package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type UserDeviceService struct {
	deviceRepo repository.UserDeviceRepository
}

func NewUserDeviceService(deviceRepo repository.UserDeviceRepository) *UserDeviceService {
	return &UserDeviceService{
		deviceRepo: deviceRepo,
	}
}

type RegisterDeviceRequest struct {
	UserID       uuid.UUID              `json:"user_id"`
	DeviceType   string                 `json:"device_type" binding:"required"`
	DeviceName   *string                `json:"device_name"`
	DeviceModel  *string                `json:"device_model"`
	Manufacturer *string                `json:"manufacturer"`
	OS           *string                `json:"os"`
	OSVersion    *string                `json:"os_version"`
	Browser      *string                `json:"browser"`
	BrowserVersion *string              `json:"browser_version"`
	AppName      *string                `json:"app_name"`
	AppVersion   *string                `json:"app_version"`
	IPAddress    string                 `json:"-"`
	UserAgent    string                 `json:"-"`
	Location     map[string]interface{} `json:"location"`
	PushToken    *string                `json:"push_token"`
	Metadata     map[string]interface{} `json:"metadata"`
}

type UpdateDeviceRequest struct {
	DeviceName   *string                `json:"device_name"`
	PushToken    *string                `json:"push_token"`
	Location     map[string]interface{} `json:"location"`
	Metadata     map[string]interface{} `json:"metadata"`
}

// GetByID gets device by ID
func (s *UserDeviceService) GetByID(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	return s.deviceRepo.GetByID(ctx, id)
}

// ListByUser lists devices by user
func (s *UserDeviceService) ListByUser(ctx context.Context, userID uuid.UUID, status string, page, limit int) ([]*models.UserDevice, int64, error) {
	offset := (page - 1) * limit
	return s.deviceRepo.ListByUser(ctx, userID, status, limit, offset)
}

// RegisterDevice registers a new device
func (s *UserDeviceService) RegisterDevice(ctx context.Context, req RegisterDeviceRequest) (*models.UserDevice, error) {
	// Validate device type
	validTypes := []string{"desktop", "mobile", "tablet", "watch", "tv", "other"}
	if !containsDeviceType(validTypes, req.DeviceType) {
		return nil, fmt.Errorf("invalid device type, must be one of: %v", validTypes)
	}

	// Generate fingerprint
	fingerprint := s.generateFingerprint(req)

	// Check if device already exists
	existing, err := s.deviceRepo.GetByFingerprint(ctx, req.UserID, fingerprint)
	if err == nil && existing != nil {
		// Update existing device
		existing.LoginCount++
		existing.LastUsedAt = time.Now()
		existing.IPAddress = req.IPAddress
		existing.UserAgent = req.UserAgent
		if req.PushToken != nil {
			existing.PushToken = req.PushToken
		}
		existing.UpdatedAt = time.Now()
		_ = s.deviceRepo.Update(ctx, existing)
		return existing, nil
	}

	// Parse IP address
	var ipAddr *net.IP
	if req.IPAddress != "" {
		parsed := net.ParseIP(req.IPAddress)
		if parsed != nil {
			ipAddr = &parsed
		}
	}

	location := req.Location
	if location == nil {
		location = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	now := time.Now()
	device := &models.UserDevice{
		ID:             uuid.New(),
		UserID:         req.UserID,
		DeviceType:     req.DeviceType,
		DeviceName:     req.DeviceName,
		DeviceModel:    req.DeviceModel,
		Manufacturer:   req.Manufacturer,
		OS:             req.OS,
		OSVersion:      req.OSVersion,
		Browser:        req.Browser,
		BrowserVersion: req.BrowserVersion,
		AppName:        req.AppName,
		AppVersion:     req.AppVersion,
		IPAddress:      ipAddr,
		UserAgent:      &req.UserAgent,
		Location:       location,
		IsTrusted:      false,
		Fingerprint:    &fingerprint,
		PushToken:      req.PushToken,
		FirstSeenAt:    now,
		LastUsedAt:     now,
		LoginCount:     1,
		Status:         "active",
		Metadata:       metadata,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.deviceRepo.Create(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to register device: %w", err)
	}

	return device, nil
}

// UpdateDevice updates a device
func (s *UserDeviceService) UpdateDevice(ctx context.Context, id uuid.UUID, req UpdateDeviceRequest) (*models.UserDevice, error) {
	device, err := s.deviceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	if req.DeviceName != nil {
		device.DeviceName = req.DeviceName
	}
	if req.PushToken != nil {
		device.PushToken = req.PushToken
	}
	if req.Location != nil {
		device.Location = req.Location
	}
	if req.Metadata != nil {
		device.Metadata = req.Metadata
	}

	device.UpdatedAt = time.Now()

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to update device: %w", err)
	}

	return device, nil
}

// DeleteDevice deletes a device
func (s *UserDeviceService) DeleteDevice(ctx context.Context, id uuid.UUID) error {
	return s.deviceRepo.Delete(ctx, id)
}

// RevokeDevice revokes a device
func (s *UserDeviceService) RevokeDevice(ctx context.Context, id uuid.UUID, reason string) (*models.UserDevice, error) {
	device, err := s.deviceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	now := time.Now()
	device.Status = "revoked"
	device.RevokedAt = &now
	if reason != "" {
		device.RevokedReason = &reason
	}
	device.UpdatedAt = now

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to revoke device: %w", err)
	}

	return device, nil
}

// TrustDevice trusts a device
func (s *UserDeviceService) TrustDevice(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	device, err := s.deviceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	device.IsTrusted = true
	device.UpdatedAt = time.Now()

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to trust device: %w", err)
	}

	return device, nil
}

// UntrustDevice untrusts a device
func (s *UserDeviceService) UntrustDevice(ctx context.Context, id uuid.UUID) (*models.UserDevice, error) {
	device, err := s.deviceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	device.IsTrusted = false
	device.UpdatedAt = time.Now()

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to untrust device: %w", err)
	}

	return device, nil
}

// UpdateActivity updates device activity
func (s *UserDeviceService) UpdateActivity(ctx context.Context, id uuid.UUID, ipAddress string) (*models.UserDevice, error) {
	device, err := s.deviceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	device.LastUsedAt = time.Now()
	device.LoginCount++
	if ipAddress != "" {
		parsed := net.ParseIP(ipAddress)
		if parsed != nil {
			device.IPAddress = &parsed
		}
	}
	device.UpdatedAt = time.Now()

	if err := s.deviceRepo.Update(ctx, device); err != nil {
		return nil, fmt.Errorf("failed to update activity: %w", err)
	}

	return device, nil
}

// GetTrustedDevices gets trusted devices for user
func (s *UserDeviceService) GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]*models.UserDevice, error) {
	devices, _, err := s.deviceRepo.ListByUser(ctx, userID, "", 1000, 0)
	if err != nil {
		return nil, err
	}

	trusted := make([]*models.UserDevice, 0)
	for _, device := range devices {
		if device.IsTrusted && device.Status == "active" {
			trusted = append(trusted, device)
		}
	}

	return trusted, nil
}

// RevokeAllDevices revokes all devices for user
func (s *UserDeviceService) RevokeAllDevices(ctx context.Context, userID uuid.UUID, exceptCurrent bool, reason string) (int, error) {
	devices, _, err := s.deviceRepo.ListByUser(ctx, userID, "", 1000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	now := time.Now()

	for _, device := range devices {
		if device.Status == "active" {
			// TODO: Skip current device if exceptCurrent is true
			device.Status = "revoked"
			device.RevokedAt = &now
			if reason != "" {
				device.RevokedReason = &reason
			}
			device.UpdatedAt = now
			_ = s.deviceRepo.Update(ctx, device)
			count++
		}
	}

	return count, nil
}

// CleanupInactiveDevices removes inactive devices
func (s *UserDeviceService) CleanupInactiveDevices(ctx context.Context, inactiveDays int) (int, error) {
	devices, _, err := s.deviceRepo.ListByUser(ctx, uuid.Nil, "", 10000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	cutoff := time.Now().AddDate(0, 0, -inactiveDays)

	for _, device := range devices {
		if device.LastUsedAt.Before(cutoff) && device.Status == "active" {
			device.Status = "inactive"
			device.UpdatedAt = time.Now()
			_ = s.deviceRepo.Update(ctx, device)
			count++
		}
	}

	return count, nil
}

// Helper functions
func (s *UserDeviceService) generateFingerprint(req RegisterDeviceRequest) string {
	// Create a unique fingerprint based on device characteristics
	parts := []string{
		req.DeviceType,
		getString(req.DeviceModel),
		getString(req.Manufacturer),
		getString(req.OS),
		getString(req.OSVersion),
		getString(req.Browser),
		req.UserAgent,
	}

	combined := strings.Join(parts, "|")
	hash := sha256.Sum256([]byte(combined))
	return hex.EncodeToString(hash[:])
}

func getString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func containsDeviceType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
