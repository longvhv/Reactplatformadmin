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

// AuthorizationService handles authorization and permission checking
type AuthorizationService struct {
	userRoleRepo   repository.UserRoleRepository
	roleRepo       repository.RoleRepository
	permissionRepo repository.PermissionRepository
	cache          cache.Cache
}

// NewAuthorizationService creates a new authorization service
func NewAuthorizationService(
	userRoleRepo repository.UserRoleRepository,
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	cache cache.Cache,
) *AuthorizationService {
	return &AuthorizationService{
		userRoleRepo:   userRoleRepo,
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		cache:          cache,
	}
}

// GetUserPermissions gets all permissions for a user in a tenant
func (s *AuthorizationService) GetUserPermissions(ctx context.Context, userID, tenantID uuid.UUID) ([]string, error) {
	// Try to get from cache first
	cacheKey := cache.PermissionCacheKey(userID.String(), tenantID.String())
	var permissions []string
	
	err := s.cache.GetJSON(ctx, cacheKey, &permissions)
	if err == nil {
		return permissions, nil
	}

	// Get user roles in this tenant
	userRoles, err := s.userRoleRepo.ListByUserAndTenant(ctx, userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}

	// Collect all permission codes from roles
	permissionMap := make(map[string]bool)
	
	for _, userRole := range userRoles {
		// Skip inactive or expired roles
		if !userRole.IsActive {
			continue
		}
		if userRole.ExpiresAt != nil && userRole.ExpiresAt.Before(time.Now()) {
			continue
		}

		// Get role details
		role, err := s.roleRepo.GetByID(ctx, userRole.RoleID)
		if err != nil {
			continue
		}

		// Add all permission codes from this role
		for _, code := range role.PermissionCodes {
			permissionMap[code] = true
		}
	}

	// Convert map to slice
	permissions = make([]string, 0, len(permissionMap))
	for code := range permissionMap {
		permissions = append(permissions, code)
	}

	// Cache for 15 minutes
	_ = s.cache.SetJSON(ctx, cacheKey, permissions, cache.PermissionTTL)

	return permissions, nil
}

// HasPermission checks if user has a specific permission
func (s *AuthorizationService) HasPermission(ctx context.Context, userID, tenantID uuid.UUID, permissionCode string) (bool, error) {
	permissions, err := s.GetUserPermissions(ctx, userID, tenantID)
	if err != nil {
		return false, err
	}

	for _, code := range permissions {
		if code == permissionCode {
			return true, nil
		}
	}

	return false, nil
}

// HasAnyPermission checks if user has any of the specified permissions
func (s *AuthorizationService) HasAnyPermission(ctx context.Context, userID, tenantID uuid.UUID, permissionCodes []string) (bool, error) {
	permissions, err := s.GetUserPermissions(ctx, userID, tenantID)
	if err != nil {
		return false, err
	}

	permissionMap := make(map[string]bool)
	for _, code := range permissions {
		permissionMap[code] = true
	}

	for _, code := range permissionCodes {
		if permissionMap[code] {
			return true, nil
		}
	}

	return false, nil
}

// HasAllPermissions checks if user has all of the specified permissions
func (s *AuthorizationService) HasAllPermissions(ctx context.Context, userID, tenantID uuid.UUID, permissionCodes []string) (bool, error) {
	permissions, err := s.GetUserPermissions(ctx, userID, tenantID)
	if err != nil {
		return false, err
	}

	permissionMap := make(map[string]bool)
	for _, code := range permissions {
		permissionMap[code] = true
	}

	for _, code := range permissionCodes {
		if !permissionMap[code] {
			return false, nil
		}
	}

	return true, nil
}

// GetUserRoles gets all roles for a user in a tenant
func (s *AuthorizationService) GetUserRoles(ctx context.Context, userID, tenantID uuid.UUID) ([]*models.Role, error) {
	userRoles, err := s.userRoleRepo.ListByUserAndTenant(ctx, userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}

	roles := make([]*models.Role, 0)
	for _, userRole := range userRoles {
		// Skip inactive or expired roles
		if !userRole.IsActive {
			continue
		}
		if userRole.ExpiresAt != nil && userRole.ExpiresAt.Before(time.Now()) {
			continue
		}

		role, err := s.roleRepo.GetByID(ctx, userRole.RoleID)
		if err != nil {
			continue
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// IsTenantOwner checks if user is tenant owner
func (s *AuthorizationService) IsTenantOwner(ctx context.Context, userID, tenantID uuid.UUID) (bool, error) {
	// This should check tenant_members table for OWNER role
	// For now, simplified implementation
	roles, err := s.GetUserRoles(ctx, userID, tenantID)
	if err != nil {
		return false, err
	}

	for _, role := range roles {
		if role.Name == "OWNER" || role.Type == "SYSTEM" {
			return true, nil
		}
	}

	return false, nil
}

// IsTenantAdmin checks if user is tenant admin
func (s *AuthorizationService) IsTenantAdmin(ctx context.Context, userID, tenantID uuid.UUID) (bool, error) {
	roles, err := s.GetUserRoles(ctx, userID, tenantID)
	if err != nil {
		return false, err
	}

	for _, role := range roles {
		if role.Name == "ADMIN" || role.Name == "OWNER" {
			return true, nil
		}
	}

	return false, nil
}

// InvalidateUserPermissions invalidates permission cache for a user
func (s *AuthorizationService) InvalidateUserPermissions(ctx context.Context, userID, tenantID uuid.UUID) error {
	cacheKey := cache.PermissionCacheKey(userID.String(), tenantID.String())
	return s.cache.Delete(ctx, cacheKey)
}

// GrantRole grants a role to a user
func (s *AuthorizationService) GrantRole(ctx context.Context, userID, roleID, tenantID, grantedBy uuid.UUID) error {
	userRole := &models.UserRole{
		ID:        uuid.New(),
		UserID:    userID,
		RoleID:    roleID,
		TenantID:  &tenantID,
		Scope:     "tenant",
		GrantedBy: &grantedBy,
		GrantedAt: time.Now(),
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.userRoleRepo.Create(ctx, userRole); err != nil {
		return fmt.Errorf("failed to grant role: %w", err)
	}

	// Invalidate cache
	_ = s.InvalidateUserPermissions(ctx, userID, tenantID)

	return nil
}

// RevokeRole revokes a role from a user
func (s *AuthorizationService) RevokeRole(ctx context.Context, userID, roleID, tenantID uuid.UUID) error {
	// Get user role
	userRoles, err := s.userRoleRepo.ListByUserAndTenant(ctx, userID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to get user roles: %w", err)
	}

	for _, userRole := range userRoles {
		if userRole.RoleID == roleID {
			if err := s.userRoleRepo.Delete(ctx, userRole.ID); err != nil {
				return fmt.Errorf("failed to revoke role: %w", err)
			}
		}
	}

	// Invalidate cache
	_ = s.InvalidateUserPermissions(ctx, userID, tenantID)

	return nil
}

// Permission constants
const (
	// User management
	PermissionUserView   = "user:view"
	PermissionUserCreate = "user:create"
	PermissionUserUpdate = "user:update"
	PermissionUserDelete = "user:delete"

	// Tenant management
	PermissionTenantView   = "tenant:view"
	PermissionTenantCreate = "tenant:create"
	PermissionTenantUpdate = "tenant:update"
	PermissionTenantDelete = "tenant:delete"

	// Role management
	PermissionRoleView   = "role:view"
	PermissionRoleCreate = "role:create"
	PermissionRoleUpdate = "role:update"
	PermissionRoleDelete = "role:delete"

	// Application management
	PermissionAppView   = "app:view"
	PermissionAppCreate = "app:create"
	PermissionAppUpdate = "app:update"
	PermissionAppDelete = "app:delete"

	// Product management
	PermissionProductView   = "product:view"
	PermissionProductCreate = "product:create"
	PermissionProductUpdate = "product:update"
	PermissionProductDelete = "product:delete"

	// Order management
	PermissionOrderView   = "order:view"
	PermissionOrderCreate = "order:create"
	PermissionOrderUpdate = "order:update"
	PermissionOrderDelete = "order:delete"

	// Invoice management
	PermissionInvoiceView   = "invoice:view"
	PermissionInvoiceCreate = "invoice:create"
	PermissionInvoiceUpdate = "invoice:update"
	PermissionInvoiceDelete = "invoice:delete"

	// Settings
	PermissionSettingsView   = "settings:view"
	PermissionSettingsUpdate = "settings:update"

	// Analytics
	PermissionAnalyticsView = "analytics:view"

	// Audit logs
	PermissionAuditView = "audit:view"
)
