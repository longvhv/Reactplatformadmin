package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository/yugabyte"
)

// TenantService handles tenant business logic
type TenantService struct {
	tenantRepo *yugabyte.tenantRepository
	userRepo   *yugabyte.userRepository
	memberRepo *yugabyte.tenantMemberRepository
}

// NewTenantService creates a new tenant service
func NewTenantService(
	tenantRepo *yugabyte.tenantRepository,
	userRepo *yugabyte.userRepository,
	memberRepo *yugabyte.tenantMemberRepository,
) *TenantService {
	return &TenantService{
		tenantRepo: tenantRepo,
		userRepo:   userRepo,
		memberRepo: memberRepo,
	}
}

// CreateTenantRequest represents create tenant request
type CreateTenantRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Slug        string                 `json:"slug" binding:"required"`
	Description *string                `json:"description"`
	Settings    map[string]interface{} `json:"settings"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// CreateTenant creates a new tenant
func (s *TenantService) CreateTenant(ctx context.Context, req CreateTenantRequest) (*models.Tenant, error) {
	// Validate code format (uppercase alphanumeric and underscore)
	req.Slug = strings.ToUpper(req.Slug)
	if !isValidCode(req.Slug) {
		return nil, fmt.Errorf("invalid tenant code format")
	}

	// Check if code already exists
	exists, err := s.tenantRepo.Exists(ctx, req.Slug)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("tenant code already exists")
	}

	// Check if owner exists
	_, err = s.userRepo.GetByID(ctx, req.OwnerID)
	if err != nil {
		return nil, fmt.Errorf("owner user not found")
	}

	// Create tenant
	tenant := models.NewTenant(req.Name, req.Slug, req.OwnerID)
	tenant.Description = req.Description
	tenant.Settings = req.Settings
	tenant.Metadata = req.Metadata

	if err := s.tenantRepo.Create(ctx, tenant); err != nil {
		return nil, fmt.Errorf("failed to create tenant")
	}

	// Add owner as primary member
	member := models.NewTenantMember(tenant.ID, req.OwnerID)
	member.IsPrimary = true
	member.IsActive = true
	member.Status = "ACTIVE"
	s.memberRepo.Create(ctx, member)

	return tenant, nil
}

// GetTenant gets tenant by ID
func (s *TenantService) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	return s.tenantRepo.GetByID(ctx, id)
}

// GetByID gets tenant by ID (alias for GetTenant)
func (s *TenantService) GetByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	return s.tenantRepo.GetByID(ctx, id)
}

// ListByUser lists tenants for a user
func (s *TenantService) ListByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]*models.Tenant, int64, error) {
	offset := (page - 1) * limit
	
	// Get user's tenant memberships
	members, err := s.memberRepo.ListByUser(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	
	if len(members) == 0 {
		return []*models.Tenant{}, 0, nil
	}
	
	// Get tenant IDs
	tenantIDs := make([]uuid.UUID, len(members))
	for i, member := range members {
		tenantIDs[i] = member.TenantID
	}
	
	// Get tenants
	tenants, total, err := s.tenantRepo.ListByIDs(ctx, tenantIDs, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	
	return tenants, total, nil
}

// ListTenants lists tenants with pagination
func (s *TenantService) ListTenants(ctx context.Context, filter models.TenantListFilter) ([]*models.Tenant, *models.PaginationMeta, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}

	tenants, total, err := s.tenantRepo.List(ctx, filter)
	if err != nil {
		return nil, nil, err
	}

	meta := models.NewPaginationMeta(filter.Page, filter.Limit, total)
	return tenants, &meta, nil
}

// UpdateTenantRequest represents update tenant request
type UpdateTenantRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	Settings    map[string]interface{} `json:"settings"`
	Metadata    map[string]interface{} `json:"metadata"`
	IsActive    *bool                  `json:"is_active"`
}

// UpdateTenant updates tenant
func (s *TenantService) UpdateTenant(ctx context.Context, id uuid.UUID, req UpdateTenantRequest) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		tenant.Name = *req.Name
	}
	if req.Description != nil {
		tenant.Description = req.Description
	}
	if req.Settings != nil {
		tenant.Settings = req.Settings
	}
	if req.Metadata != nil {
		tenant.Metadata = req.Metadata
	}
	if req.IsActive != nil {
		tenant.IsActive = *req.IsActive
	}

	tenant.Touch()

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		return nil, err
	}

	return tenant, nil
}

// DeleteTenant deletes tenant
func (s *TenantService) DeleteTenant(ctx context.Context, id uuid.UUID) error {
	return s.tenantRepo.Delete(ctx, id)
}

// DeactivateTenant deactivates tenant
func (s *TenantService) DeactivateTenant(ctx context.Context, id uuid.UUID) error {
	tenant, err := s.tenantRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	tenant.IsActive = false
	tenant.Touch()

	return s.tenantRepo.Update(ctx, tenant)
}

// ActivateTenant activates tenant
func (s *TenantService) ActivateTenant(ctx context.Context, id uuid.UUID) error {
	tenant, err := s.tenantRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	tenant.IsActive = true
	tenant.Touch()

	return s.tenantRepo.Update(ctx, tenant)
}

// Helper function to validate code
func isValidCode(code string) bool {
	if len(code) == 0 || len(code) > 50 {
		return false
	}
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') {
			return false
		}
	}
	return true
}