package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type UserRoleService struct {
	userRoleRepo repository.UserRoleRepository
}

func NewUserRoleService(userRoleRepo repository.UserRoleRepository) *UserRoleService {
	return &UserRoleService{
		userRoleRepo: userRoleRepo,
	}
}

type AssignRoleRequest struct {
	UserID    uuid.UUID  `json:"user_id" binding:"required"`
	RoleID    uuid.UUID  `json:"role_id" binding:"required"`
	TenantID  uuid.UUID  `json:"tenant_id" binding:"required"`
	Scope     string     `json:"scope"`
	ScopeID   *uuid.UUID `json:"scope_id"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// ListByUserAndTenant lists user roles by user and tenant
func (s *UserRoleService) ListByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID, page, limit int) ([]*models.UserRole, int64, error) {
	userRoles, err := s.userRoleRepo.ListByUserAndTenant(ctx, userID, tenantID)
	if err != nil {
		return nil, 0, err
	}

	total := int64(len(userRoles))
	start := (page - 1) * limit
	end := start + limit

	if start > len(userRoles) {
		return []*models.UserRole{}, total, nil
	}

	if end > len(userRoles) {
		end = len(userRoles)
	}

	return userRoles[start:end], total, nil
}

// AssignRole assigns a role to user
func (s *UserRoleService) AssignRole(ctx context.Context, req AssignRoleRequest, grantedBy uuid.UUID) error {
	// Check if user already has this role
	existingRoles, err := s.userRoleRepo.ListByUserAndTenant(ctx, req.UserID, req.TenantID)
	if err != nil {
		return fmt.Errorf("failed to check existing roles: %w", err)
	}

	for _, userRole := range existingRoles {
		if userRole.RoleID == req.RoleID && userRole.IsActive {
			return fmt.Errorf("user already has this role")
		}
	}

	scope := req.Scope
	if scope == "" {
		scope = "tenant"
	}

	userRole := &models.UserRole{
		ID:        uuid.New(),
		UserID:    req.UserID,
		RoleID:    req.RoleID,
		TenantID:  &req.TenantID,
		Scope:     scope,
		ScopeID:   req.ScopeID,
		GrantedBy: &grantedBy,
		GrantedAt: time.Now(),
		ExpiresAt: req.ExpiresAt,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.userRoleRepo.Create(ctx, userRole); err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

// RevokeRole revokes a role from user
func (s *UserRoleService) RevokeRole(ctx context.Context, userRoleID uuid.UUID) error {
	return s.userRoleRepo.Delete(ctx, userRoleID)
}

// RevokeExpiredRoles revokes all expired roles
func (s *UserRoleService) RevokeExpiredRoles(ctx context.Context) (int64, error) {
	return s.userRoleRepo.RevokeExpiredRoles(ctx)
}
