package service

import "github.com/google/uuid"

// CreateRoleRequest represents create role request
type CreateRoleRequest struct {
	TenantID        uuid.UUID `json:"tenant_id" binding:"required"`
	Name            string    `json:"name" binding:"required"`
	Description     *string   `json:"description"`
	Type            string    `json:"type" binding:"required"`
	PermissionCodes []string  `json:"permission_codes" binding:"required"`
}

// UpdateRoleRequest represents update role request
type UpdateRoleRequest struct {
	Name            *string  `json:"name"`
	Description     *string  `json:"description"`
	PermissionCodes []string `json:"permission_codes"`
}
