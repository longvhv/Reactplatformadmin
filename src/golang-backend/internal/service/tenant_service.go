package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

// TenantService handles business logic for tenants
type TenantService struct {
	repo *repository.TenantRepository
}

// NewTenantService creates a new tenant service
func NewTenantService(repo *repository.TenantRepository) *TenantService {
	return &TenantService{repo: repo}
}

// GetAll retrieves all tenants with filters
func (s *TenantService) GetAll(ctx context.Context, filters models.TenantFilters) ([]models.Tenant, error) {
	return s.repo.GetAll(ctx, filters)
}

// GetByID retrieves a tenant by ID
func (s *TenantService) GetByID(ctx context.Context, id string) (*models.Tenant, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid tenant ID format")
	}
	return s.repo.GetByID(ctx, id)
}

// GetByCode retrieves a tenant by code
func (s *TenantService) GetByCode(ctx context.Context, code string) (*models.Tenant, error) {
	return s.repo.GetByCode(ctx, code)
}

// Create creates a new tenant
func (s *TenantService) Create(ctx context.Context, req models.CreateTenantRequest) (*models.Tenant, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	// Check if code already exists
	existing, _ := s.repo.GetByCode(ctx, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("tenant code already exists")
	}

	return s.repo.Create(ctx, req)
}

// Update updates a tenant
func (s *TenantService) Update(ctx context.Context, id string, req models.UpdateTenantRequest) (*models.Tenant, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid tenant ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

// Delete deletes a tenant
func (s *TenantService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid tenant ID format")
	}
	return s.repo.Delete(ctx, id)
}

// validateCreateRequest validates create tenant request
func (s *TenantService) validateCreateRequest(req models.CreateTenantRequest) error {
	code := strings.TrimSpace(req.Code)
	if code == "" {
		return fmt.Errorf("tenant code is required")
	}
	if !isValidTenantCode(code) {
		return fmt.Errorf("tenant code must be 2-50 alphanumeric characters with hyphens")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("tenant name is required")
	}
	if len(name) > 255 {
		return fmt.Errorf("tenant name cannot exceed 255 characters")
	}

	return nil
}

// validateUpdateRequest validates update tenant request
func (s *TenantService) validateUpdateRequest(req models.UpdateTenantRequest) error {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("tenant name cannot be empty")
		}
		if len(name) > 255 {
			return fmt.Errorf("tenant name cannot exceed 255 characters")
		}
	}
	return nil
}

// isValidTenantCode checks if tenant code is valid
func isValidTenantCode(code string) bool {
	match, _ := regexp.MatchString(`^[a-zA-Z0-9-]{2,50}$`, code)
	return match
}
