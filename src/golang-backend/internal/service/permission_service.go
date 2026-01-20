package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

// PermissionService handles business logic for permissions
type PermissionService struct {
	repo *repository.PermissionRepository
}

// NewPermissionService creates a new permission service
func NewPermissionService(repo *repository.PermissionRepository) *PermissionService {
	return &PermissionService{repo: repo}
}

// GetAll retrieves all permissions with filters
func (s *PermissionService) GetAll(ctx context.Context, filters models.PermissionFilters) ([]models.Permission, error) {
	return s.repo.GetAll(ctx, filters)
}

// GetByID retrieves a permission by ID
func (s *PermissionService) GetByID(ctx context.Context, id string) (*models.Permission, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid permission ID format")
	}
	return s.repo.GetByID(ctx, id)
}

// GetByCode retrieves a permission by code
func (s *PermissionService) GetByCode(ctx context.Context, code string) (*models.Permission, error) {
	if !isValidPermissionCode(code) {
		return nil, fmt.Errorf("invalid permission code format")
	}
	return s.repo.GetByCode(ctx, code)
}

// GetByCodes retrieves multiple permissions by their codes
func (s *PermissionService) GetByCodes(ctx context.Context, codes []string) ([]models.Permission, error) {
	// Validate all codes
	for _, code := range codes {
		if !isValidPermissionCode(code) {
			return nil, fmt.Errorf("invalid permission code: %s", code)
		}
	}
	return s.repo.GetByCodes(ctx, codes)
}

// Create creates a new permission
func (s *PermissionService) Create(ctx context.Context, req models.CreatePermissionRequest) (*models.Permission, error) {
	// Validate request
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	// Check if code already exists
	existing, err := s.repo.GetByCode(ctx, req.Code)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("permission code already exists")
	}

	return s.repo.Create(ctx, req)
}

// Update updates a permission
func (s *PermissionService) Update(ctx context.Context, id string, req models.UpdatePermissionRequest) (*models.Permission, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid permission ID format")
	}

	// Validate request
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	// Check if permission exists
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cannot modify system permissions
	if existing.IsSystem {
		return nil, fmt.Errorf("cannot modify system permissions")
	}

	return s.repo.Update(ctx, id, req)
}

// Delete deletes a permission
func (s *PermissionService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid permission ID format")
	}

	// Check if permission exists
	permission, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Cannot delete system permissions
	if permission.IsSystem {
		return fmt.Errorf("cannot delete system permissions")
	}

	// TODO: Check if permission is assigned to any roles
	// This should query roles table to see if this permission code is in use

	return s.repo.Delete(ctx, id)
}

// GetByCategory retrieves permissions grouped by category
func (s *PermissionService) GetByCategory(ctx context.Context) (map[string][]models.Permission, error) {
	allPerms, err := s.repo.GetAll(ctx, models.PermissionFilters{})
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]models.Permission)
	for _, perm := range allPerms {
		category := string(perm.Category)
		grouped[category] = append(grouped[category], perm)
	}

	return grouped, nil
}

// ValidatePermissionCodes checks if all provided codes exist
func (s *PermissionService) ValidatePermissionCodes(ctx context.Context, codes []string) (bool, []string, error) {
	if len(codes) == 0 {
		return true, []string{}, nil
	}

	existing, err := s.repo.GetByCodes(ctx, codes)
	if err != nil {
		return false, nil, err
	}

	// Create map of existing codes
	existingMap := make(map[string]bool)
	for _, perm := range existing {
		existingMap[perm.Code] = true
	}

	// Find invalid codes
	var invalid []string
	for _, code := range codes {
		if !existingMap[code] {
			invalid = append(invalid, code)
		}
	}

	if len(invalid) > 0 {
		return false, invalid, nil
	}

	return true, []string{}, nil
}

// validateCreateRequest validates create permission request
func (s *PermissionService) validateCreateRequest(req models.CreatePermissionRequest) error {
	// Validate code
	code := strings.TrimSpace(req.Code)
	if code == "" {
		return fmt.Errorf("permission code is required")
	}
	if !isValidPermissionCode(code) {
		return fmt.Errorf("permission code must be 3-100 characters with format: category.resource.action")
	}

	// Validate name
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("permission name is required")
	}
	if len(name) > 255 {
		return fmt.Errorf("permission name cannot exceed 255 characters")
	}

	// Validate category
	if !isValidPermissionCategory(req.Category) {
		return fmt.Errorf("invalid permission category")
	}

	// Validate type
	if !isValidPermissionType(req.Type) {
		return fmt.Errorf("invalid permission type")
	}

	return nil
}

// validateUpdateRequest validates update permission request
func (s *PermissionService) validateUpdateRequest(req models.UpdatePermissionRequest) error {
	// Validate name if provided
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("permission name cannot be empty")
		}
		if len(name) > 255 {
			return fmt.Errorf("permission name cannot exceed 255 characters")
		}
	}

	// Validate category if provided
	if req.Category != nil && !isValidPermissionCategory(*req.Category) {
		return fmt.Errorf("invalid permission category")
	}

	// Validate type if provided
	if req.Type != nil && !isValidPermissionType(*req.Type) {
		return fmt.Errorf("invalid permission type")
	}

	return nil
}

// Helper validation functions
func isValidPermissionCode(code string) bool {
	// Format: category.resource.action (e.g., users.read, roles.write, system.manage)
	match, _ := regexp.MatchString(`^[a-z0-9._-]{3,100}$`, code)
	return match
}

func isValidPermissionCategory(category models.PermissionCategory) bool {
	validCategories := []models.PermissionCategory{
		models.PermissionCategoryUsers,
		models.PermissionCategoryRoles,
		models.PermissionCategoryTenants,
		models.PermissionCategoryApplications,
		models.PermissionCategoryProducts,
		models.PermissionCategoryPackages,
		models.PermissionCategoryOrders,
		models.PermissionCategoryInvoices,
		models.PermissionCategorySubscriptions,
		models.PermissionCategoryWebhooks,
		models.PermissionCategoryAnnouncements,
		models.PermissionCategorySettings,
		models.PermissionCategoryReports,
		models.PermissionCategorySystem,
	}

	for _, valid := range validCategories {
		if category == valid {
			return true
		}
	}
	return false
}

func isValidPermissionType(permType models.PermissionType) bool {
	return permType == models.PermissionTypeRead ||
		permType == models.PermissionTypeWrite ||
		permType == models.PermissionTypeDelete ||
		permType == models.PermissionTypeManage
}
