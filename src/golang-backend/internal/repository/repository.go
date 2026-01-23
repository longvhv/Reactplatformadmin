package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
)

// UserRepository interface for user operations
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter models.UserListFilter) ([]*models.User, int, error)
	Exists(ctx context.Context, email string) (bool, error)
}

// TenantRepository interface for tenant operations
type TenantRepository interface {
	Create(ctx context.Context, tenant *models.Tenant) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error)
	GetByCode(ctx context.Context, code string) (*models.Tenant, error)
	Update(ctx context.Context, tenant *models.Tenant) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter models.TenantListFilter) ([]*models.Tenant, int, error)
	Exists(ctx context.Context, code string) (bool, error)
}

// TenantMemberRepository interface for tenant member operations
type TenantMemberRepository interface {
	Create(ctx context.Context, member *models.TenantMember) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.TenantMember, error)
	GetByTenantAndUser(ctx context.Context, tenantID, userID uuid.UUID) (*models.TenantMember, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.TenantMember, int, error)
	Update(ctx context.Context, member *models.TenantMember) error
	Delete(ctx context.Context, id uuid.UUID) error
	Exists(ctx context.Context, tenantID, userID uuid.UUID) (bool, error)
}

// DepartmentRepository interface for department operations
type DepartmentRepository interface {
	Create(ctx context.Context, dept *models.Department) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error)
	GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Department, int, error)
	Update(ctx context.Context, dept *models.Department) error
	Delete(ctx context.Context, id uuid.UUID) error
	Exists(ctx context.Context, tenantID uuid.UUID, code string) (bool, error)
}

// WebhookRepository interface for webhook operations
type WebhookRepository interface {
	Create(ctx context.Context, webhook *models.Webhook) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Webhook, int, error)
	Update(ctx context.Context, webhook *models.Webhook) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementSuccessCount(ctx context.Context, id uuid.UUID) error
	IncrementFailureCount(ctx context.Context, id uuid.UUID) error
}

// RoleRepository interface for role operations
type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error)
	GetByCode(ctx context.Context, code string, tenantID *uuid.UUID) (*models.Role, error)
	ListByTenant(ctx context.Context, tenantID *uuid.UUID, page, limit int) ([]*models.Role, int, error)
	Update(ctx context.Context, role *models.Role) error
	Delete(ctx context.Context, id uuid.UUID) error
	AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error
	RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error
}

// PermissionRepository interface for permission operations
type PermissionRepository interface {
	Create(ctx context.Context, permission *models.Permission) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Permission, error)
	GetByCode(ctx context.Context, code string) (*models.Permission, error)
	List(ctx context.Context, page, limit int) ([]*models.Permission, int, error)
	ListByRole(ctx context.Context, roleID uuid.UUID) ([]*models.Permission, error)
	Update(ctx context.Context, permission *models.Permission) error
	Delete(ctx context.Context, id uuid.UUID) error
}
