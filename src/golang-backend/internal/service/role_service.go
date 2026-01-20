package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

// RoleService handles business logic for roles
type RoleService struct {
	repo *repository.RoleRepository
}

// NewRoleService creates a new role service
func NewRoleService(repo *repository.RoleRepository) *RoleService {
	return &RoleService{repo: repo}
}

// GetAll retrieves all roles with filters
func (s *RoleService) GetAll(ctx context.Context, filters models.RoleFilters) ([]models.Role, error) {
	return s.repo.GetAll(ctx, filters)
}

// GetByID retrieves a role by ID
func (s *RoleService) GetByID(ctx context.Context, id string) (*models.Role, error) {
	// Validate UUID
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid role ID format")
	}

	return s.repo.GetByID(ctx, id)
}

// Create creates a new role
func (s *RoleService) Create(ctx context.Context, req models.CreateRoleRequest) (*models.Role, error) {
	// Validate request
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, req)
}

// Update updates a role
func (s *RoleService) Update(ctx context.Context, id string, req models.UpdateRoleRequest) (*models.Role, error) {
	// Validate UUID
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid role ID format")
	}

	// Validate request
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	// Check if role exists and get current data
	currentRole, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cannot modify SYSTEM roles (except permissions)
	if currentRole.Type == models.RoleTypeSystem {
		if req.Name != nil || req.Description != nil {
			return nil, fmt.Errorf("cannot modify name or description of SYSTEM roles")
		}
	}

	return s.repo.Update(ctx, id, req)
}

// Delete deletes a role
func (s *RoleService) Delete(ctx context.Context, id string) error {
	// Validate UUID
	if !isValidUUID(id) {
		return fmt.Errorf("invalid role ID format")
	}

	// Check if role exists and is not SYSTEM
	role, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if role.Type == models.RoleTypeSystem {
		return fmt.Errorf("cannot delete SYSTEM roles")
	}

	// TODO: Check if role is assigned to any users
	// This should be done with a join to user_roles table

	return s.repo.Delete(ctx, id)
}

// validateCreateRequest validates create role request
func (s *RoleService) validateCreateRequest(req models.CreateRoleRequest) error {
	// Validate tenant ID
	if !isValidUUID(req.TenantID) {
		return fmt.Errorf("invalid tenant ID format")
	}

	// Validate name
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("role name is required")
	}
	if len(name) > 100 {
		return fmt.Errorf("role name cannot exceed 100 characters")
	}

	// Validate type
	if req.Type != "" && req.Type != models.RoleTypeSystem && req.Type != models.RoleTypeCustom {
		return fmt.Errorf("invalid role type: must be SYSTEM or CUSTOM")
	}

	return nil
}

// validateUpdateRequest validates update role request
func (s *RoleService) validateUpdateRequest(req models.UpdateRoleRequest) error {
	// Validate name if provided
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("role name cannot be empty")
		}
		if len(name) > 100 {
			return fmt.Errorf("role name cannot exceed 100 characters")
		}
	}

	return nil
}

// isValidUUID checks if string is valid UUID
func isValidUUID(s string) bool {
	_, err := uuid.Parse(s)
	return err == nil
}
