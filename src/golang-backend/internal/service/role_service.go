package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

type RoleService struct {
	roleRepo repository.RoleRepository
	cache    cache.Cache
}

func NewRoleService(roleRepo repository.RoleRepository, cache cache.Cache) *RoleService {
	return &RoleService{
		roleRepo: roleRepo,
		cache:    cache,
	}
}

// GetByID gets role by ID
func (s *RoleService) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	cacheKey := cache.RoleCacheKey(id.String())
	var role models.Role
	err := s.cache.GetJSON(ctx, cacheKey, &role)
	if err == nil {
		return &role, nil
	}

	dbRole, err := s.roleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetJSON(ctx, cacheKey, dbRole, cache.RoleTTL)
	return dbRole, nil
}

// ListByTenant lists roles by tenant
func (s *RoleService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Role, int64, error) {
	offset := (page - 1) * limit
	roles, total, err := s.roleRepo.ListByTenant(ctx, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return roles, total, nil
}

// CreateRole creates a new role
func (s *RoleService) CreateRole(ctx context.Context, req CreateRoleRequest) (*models.Role, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("role name is required")
	}

	// Check if role name exists in tenant
	exists, err := s.roleRepo.ExistsByName(ctx, req.TenantID, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to check role name: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("role name already exists in tenant")
	}

	role := &models.Role{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Name:            req.Name,
		Description:     req.Description,
		Type:            req.Type,
		PermissionCodes: req.PermissionCodes,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	if role.Type == "" {
		role.Type = "CUSTOM"
	}

	if err := s.roleRepo.Create(ctx, role); err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return role, nil
}

// UpdateRole updates a role
func (s *RoleService) UpdateRole(ctx context.Context, id uuid.UUID, req UpdateRoleRequest) (*models.Role, error) {
	role, err := s.roleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("role not found: %w", err)
	}

	// Cannot update system roles
	if role.Type == "SYSTEM" {
		return nil, fmt.Errorf("cannot update system role")
	}

	if req.Name != nil {
		// Check if new name exists
		exists, err := s.roleRepo.ExistsByName(ctx, role.TenantID, *req.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to check role name: %w", err)
		}
		if exists && *req.Name != role.Name {
			return nil, fmt.Errorf("role name already exists in tenant")
		}
		role.Name = *req.Name
	}

	if req.Description != nil {
		role.Description = req.Description
	}

	if req.PermissionCodes != nil {
		role.PermissionCodes = req.PermissionCodes
	}

	role.UpdatedAt = time.Now()
	role.Version++

	if err := s.roleRepo.Update(ctx, role); err != nil {
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	cacheKey := cache.RoleCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return role, nil
}

// DeleteRole deletes a role
func (s *RoleService) DeleteRole(ctx context.Context, id uuid.UUID) error {
	role, err := s.roleRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Cannot delete system roles
	if role.Type == "SYSTEM" {
		return fmt.Errorf("cannot delete system role")
	}

	if err := s.roleRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	cacheKey := cache.RoleCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}
