package service

import (
	"context"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type PermissionService struct {
	permissionRepo repository.PermissionRepository
}

func NewPermissionService(permissionRepo repository.PermissionRepository) *PermissionService {
	return &PermissionService{
		permissionRepo: permissionRepo,
	}
}

// ListAll lists all permissions
func (s *PermissionService) ListAll(ctx context.Context, appCode string) ([]*models.Permission, error) {
	if appCode != "" {
		return s.permissionRepo.ListByApp(ctx, appCode)
	}
	return s.permissionRepo.ListAll(ctx)
}

// GetByCode gets permission by code
func (s *PermissionService) GetByCode(ctx context.Context, code string) (*models.Permission, error) {
	return s.permissionRepo.GetByCode(ctx, code)
}

// ListByApp lists permissions by application
func (s *PermissionService) ListByApp(ctx context.Context, appCode string) ([]*models.Permission, error) {
	return s.permissionRepo.ListByApp(ctx, appCode)
}

// GetTree gets permission tree structure
func (s *PermissionService) GetTree(ctx context.Context, appCode string) ([]*models.Permission, error) {
	permissions, err := s.ListByApp(ctx, appCode)
	if err != nil {
		return nil, err
	}

	// Build tree structure
	permissionMap := make(map[string]*models.Permission)
	var rootPermissions []*models.Permission

	// First pass: create map
	for _, perm := range permissions {
		permissionMap[perm.Code] = perm
	}

	// Second pass: build tree
	for _, perm := range permissions {
		if perm.ParentCode == nil || *perm.ParentCode == "" {
			rootPermissions = append(rootPermissions, perm)
		}
	}

	return rootPermissions, nil
}
