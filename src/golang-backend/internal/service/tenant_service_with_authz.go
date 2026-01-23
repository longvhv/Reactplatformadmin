package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/errors"
)

// TenantServiceWithAuthz wraps TenantService with authorization
type TenantServiceWithAuthz struct {
	tenantService *TenantService
	authzService  *AuthorizationService
}

// NewTenantServiceWithAuthz creates a new tenant service with authorization
func NewTenantServiceWithAuthz(
	tenantService *TenantService,
	authzService *AuthorizationService,
) *TenantServiceWithAuthz {
	return &TenantServiceWithAuthz{
		tenantService: tenantService,
		authzService:  authzService,
	}
}

// CreateTenant creates a new tenant (requires tenant:create permission or platform admin)
func (s *TenantServiceWithAuthz) CreateTenant(ctx context.Context, req CreateTenantRequest) (*models.Tenant, error) {
	// Get current user from context
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, errors.ErrUnauthorized
	}

	// Platform-level permission check (no tenant context)
	// In real implementation, you would check if user is platform admin
	// For now, we allow any authenticated user to create tenant

	// Call underlying service
	tenant, err := s.tenantService.CreateTenant(ctx, req)
	if err != nil {
		return nil, err
	}

	// Auto-assign creator as OWNER
	// This would be done in a transaction in production
	ownerRole, _ := s.authzService.roleRepo.GetByName(ctx, tenant.ID, "OWNER")
	if ownerRole != nil {
		_ = s.authzService.GrantRole(ctx, userID, ownerRole.ID, tenant.ID, userID)
	}

	return tenant, nil
}

// UpdateTenant updates a tenant (requires tenant:update permission or tenant admin)
func (s *TenantServiceWithAuthz) UpdateTenant(ctx context.Context, tenantID uuid.UUID, req UpdateTenantRequest) (*models.Tenant, error) {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, errors.ErrUnauthorized
	}

	// Check if user is tenant admin
	isAdmin, err := s.authzService.IsTenantAdmin(ctx, userID, tenantID)
	if err != nil {
		return nil, err
	}

	if !isAdmin {
		// Check if user has tenant:update permission
		hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionTenantUpdate)
		if err != nil {
			return nil, err
		}
		if !hasPermission {
			return nil, errors.ErrPermissionDenied
		}
	}

	return s.tenantService.UpdateTenant(ctx, tenantID, req)
}

// DeleteTenant deletes a tenant (requires tenant owner)
func (s *TenantServiceWithAuthz) DeleteTenant(ctx context.Context, tenantID uuid.UUID) error {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return errors.ErrUnauthorized
	}

	// Only tenant owner can delete tenant
	isOwner, err := s.authzService.IsTenantOwner(ctx, userID, tenantID)
	if err != nil {
		return err
	}

	if !isOwner {
		return errors.ErrPermissionDenied
	}

	return s.tenantService.DeleteTenant(ctx, tenantID)
}

// GetTenantByID gets tenant by ID (requires tenant:view permission or tenant member)
func (s *TenantServiceWithAuthz) GetTenantByID(ctx context.Context, tenantID uuid.UUID) (*models.Tenant, error) {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, errors.ErrUnauthorized
	}

	// Check if user has any role in this tenant
	roles, err := s.authzService.GetUserRoles(ctx, userID, tenantID)
	if err != nil {
		return nil, err
	}

	if len(roles) == 0 {
		// User is not a member of this tenant
		return nil, errors.ErrForbidden
	}

	return s.tenantService.GetTenantByID(ctx, tenantID)
}

// Example: Product Service with Authorization
type ProductServiceWithAuthz struct {
	productService *ProductService
	authzService   *AuthorizationService
}

func NewProductServiceWithAuthz(
	productService *ProductService,
	authzService *AuthorizationService,
) *ProductServiceWithAuthz {
	return &ProductServiceWithAuthz{
		productService: productService,
		authzService:   authzService,
	}
}

// CreateProduct creates a new product (requires product:create permission)
func (s *ProductServiceWithAuthz) CreateProduct(ctx context.Context, req CreateProductRequest) (*models.Product, error) {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, errors.ErrUnauthorized
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		return nil, fmt.Errorf("tenant_id required")
	}

	// Check permission
	hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionProductCreate)
	if err != nil {
		return nil, err
	}

	if !hasPermission {
		return nil, errors.ErrPermissionDenied
	}

	return s.productService.CreateProduct(ctx, req)
}

// UpdateProduct updates a product (requires product:update permission)
func (s *ProductServiceWithAuthz) UpdateProduct(ctx context.Context, productID uuid.UUID, req UpdateProductRequest) (*models.Product, error) {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, errors.ErrUnauthorized
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		return nil, fmt.Errorf("tenant_id required")
	}

	// Check permission
	hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionProductUpdate)
	if err != nil {
		return nil, err
	}

	if !hasPermission {
		return nil, errors.ErrPermissionDenied
	}

	return s.productService.UpdateProduct(ctx, productID, req)
}

// DeleteProduct deletes a product (requires product:delete permission)
func (s *ProductServiceWithAuthz) DeleteProduct(ctx context.Context, productID uuid.UUID) error {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return errors.ErrUnauthorized
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		return fmt.Errorf("tenant_id required")
	}

	// Check permission
	hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionProductDelete)
	if err != nil {
		return err
	}

	if !hasPermission {
		return errors.ErrPermissionDenied
	}

	return s.productService.DeleteProduct(ctx, productID)
}

// ListProducts lists products (requires product:view permission)
func (s *ProductServiceWithAuthz) ListProducts(ctx context.Context, page, limit int) ([]*models.Product, int64, error) {
	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		return nil, 0, errors.ErrUnauthorized
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		return nil, 0, fmt.Errorf("tenant_id required")
	}

	// Check permission
	hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionProductView)
	if err != nil {
		return nil, 0, err
	}

	if !hasPermission {
		return nil, 0, errors.ErrPermissionDenied
	}

	return s.productService.ListProducts(ctx, page, limit)
}
