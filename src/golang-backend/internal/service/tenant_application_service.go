package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantApplicationService struct {
	tenantAppRepo repository.TenantApplicationRepository
}

func NewTenantApplicationService(tenantAppRepo repository.TenantApplicationRepository) *TenantApplicationService {
	return &TenantApplicationService{
		tenantAppRepo: tenantAppRepo,
	}
}

type CreateTenantApplicationRequest struct {
	TenantID    uuid.UUID              `json:"tenant_id" binding:"required"`
	AppCode     string                 `json:"app_code" binding:"required"`
	LicenseType string                 `json:"license_type"`
	MaxUsers    int                    `json:"max_users"`
	ExpiresAt   *string                `json:"expires_at"`
	Settings    map[string]interface{} `json:"settings"`
	CreatedBy   uuid.UUID              `json:"-"`
}

type UpdateTenantApplicationRequest struct {
	LicenseType *string                `json:"license_type"`
	MaxUsers    *int                   `json:"max_users"`
	ExpiresAt   *string                `json:"expires_at"`
	Settings    map[string]interface{} `json:"settings"`
	UpdatedBy   uuid.UUID              `json:"-"`
}

// GetByID gets tenant application by ID
func (s *TenantApplicationService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantApplication, error) {
	return s.tenantAppRepo.GetByID(ctx, id)
}

// GetByAppCode gets tenant application by app code
func (s *TenantApplicationService) GetByAppCode(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantApplication, error) {
	return s.tenantAppRepo.GetByAppCode(ctx, tenantID, appCode)
}

// ListByTenant lists tenant applications by tenant
func (s *TenantApplicationService) ListByTenant(ctx context.Context, tenantID uuid.UUID, isActive *bool, page, limit int) ([]*models.TenantApplication, int64, error) {
	offset := (page - 1) * limit
	return s.tenantAppRepo.ListByTenant(ctx, tenantID, isActive, limit, offset)
}

// CreateTenantApplication creates a new tenant application
func (s *TenantApplicationService) CreateTenantApplication(ctx context.Context, req CreateTenantApplicationRequest) (*models.TenantApplication, error) {
	// Check if application already exists for tenant
	existing, err := s.tenantAppRepo.GetByAppCode(ctx, req.TenantID, req.AppCode)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("application already exists for this tenant")
	}

	licenseType := req.LicenseType
	if licenseType == "" {
		licenseType = "TRIAL"
	}

	maxUsers := req.MaxUsers
	if maxUsers == 0 {
		maxUsers = 10
	}

	settings := req.Settings
	if settings == nil {
		settings = make(map[string]interface{})
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			expiresAt = &parsed
		}
	}

	now := time.Now()
	app := &models.TenantApplication{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		AppCode:     req.AppCode,
		IsActive:    true,
		ActivatedAt: &now,
		LicenseType: licenseType,
		MaxUsers:    maxUsers,
		ExpiresAt:   expiresAt,
		Settings:    settings,
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   &req.CreatedBy,
		Version:     1,
	}

	if err := s.tenantAppRepo.Create(ctx, app); err != nil {
		return nil, fmt.Errorf("failed to create tenant application: %w", err)
	}

	return app, nil
}

// UpdateTenantApplication updates a tenant application
func (s *TenantApplicationService) UpdateTenantApplication(ctx context.Context, id uuid.UUID, req UpdateTenantApplicationRequest) (*models.TenantApplication, error) {
	app, err := s.tenantAppRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("application not found: %w", err)
	}

	if req.LicenseType != nil {
		app.LicenseType = *req.LicenseType
	}
	if req.MaxUsers != nil {
		app.MaxUsers = *req.MaxUsers
	}
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			app.ExpiresAt = &parsed
		}
	}
	if req.Settings != nil {
		app.Settings = req.Settings
	}

	app.UpdatedAt = time.Now()
	app.UpdatedBy = &req.UpdatedBy
	app.Version++

	if err := s.tenantAppRepo.Update(ctx, app); err != nil {
		return nil, fmt.Errorf("failed to update tenant application: %w", err)
	}

	return app, nil
}

// DeleteTenantApplication deletes a tenant application
func (s *TenantApplicationService) DeleteTenantApplication(ctx context.Context, id uuid.UUID) error {
	app, err := s.tenantAppRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("application not found: %w", err)
	}

	if app.IsActive {
		return fmt.Errorf("cannot delete active application, deactivate it first")
	}

	return s.tenantAppRepo.Delete(ctx, id)
}

// ActivateApplication activates a tenant application
func (s *TenantApplicationService) ActivateApplication(ctx context.Context, id uuid.UUID) (*models.TenantApplication, error) {
	app, err := s.tenantAppRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("application not found: %w", err)
	}

	if app.IsActive {
		return app, nil
	}

	now := time.Now()
	app.IsActive = true
	app.ActivatedAt = &now
	app.DeactivatedAt = nil
	app.UpdatedAt = now
	app.Version++

	if err := s.tenantAppRepo.Update(ctx, app); err != nil {
		return nil, fmt.Errorf("failed to activate application: %w", err)
	}

	return app, nil
}

// DeactivateApplication deactivates a tenant application
func (s *TenantApplicationService) DeactivateApplication(ctx context.Context, id uuid.UUID) (*models.TenantApplication, error) {
	app, err := s.tenantAppRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("application not found: %w", err)
	}

	if !app.IsActive {
		return app, nil
	}

	now := time.Now()
	app.IsActive = false
	app.DeactivatedAt = &now
	app.UpdatedAt = now
	app.Version++

	if err := s.tenantAppRepo.Update(ctx, app); err != nil {
		return nil, fmt.Errorf("failed to deactivate application: %w", err)
	}

	return app, nil
}
