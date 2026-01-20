package models

// RoleType represents the type of role
type RoleType string

const (
	RoleTypeSystem RoleType = "SYSTEM"
	RoleTypeCustom RoleType = "CUSTOM"
)

// Role represents a role in the system
type Role struct {
	BaseModel
	TenantID        string   `json:"tenant_id" db:"tenant_id" validate:"required,uuid"`
	Name            string   `json:"name" db:"name" validate:"required,min=1,max=100"`
	Description     *string  `json:"description,omitempty" db:"description"`
	Type            RoleType `json:"type" db:"type" validate:"required,oneof=SYSTEM CUSTOM"`
	PermissionCodes []string `json:"permission_codes" db:"permission_codes"`
}

// CreateRoleRequest represents request to create a role
type CreateRoleRequest struct {
	TenantID        string   `json:"tenant_id" validate:"required,uuid"`
	Name            string   `json:"name" validate:"required,min=1,max=100"`
	Description     *string  `json:"description,omitempty"`
	Type            RoleType `json:"type,omitempty"`
	PermissionCodes []string `json:"permission_codes,omitempty"`
}

// UpdateRoleRequest represents request to update a role
type UpdateRoleRequest struct {
	Name            *string  `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Description     *string  `json:"description,omitempty"`
	PermissionCodes []string `json:"permission_codes,omitempty"`
}

// RoleFilters represents filters for querying roles
type RoleFilters struct {
	TenantID       *string   `json:"tenant_id,omitempty"`
	Type           *RoleType `json:"type,omitempty"`
	HasPermissions *bool     `json:"has_permissions,omitempty"`
	Search         *string   `json:"search,omitempty"`
}
