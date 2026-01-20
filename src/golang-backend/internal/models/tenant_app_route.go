package models

import (
	"time"

	"github.com/google/uuid"
)

// TenantAppRoute represents a tenant's application routing configuration
type TenantAppRoute struct {
	ID             uuid.UUID `json:"_id" db:"_id"`
	TenantID       uuid.UUID `json:"tenant_id" db:"tenant_id"`
	AppCode        string    `json:"app_code" db:"app_code"`
	Domain         string    `json:"domain" db:"domain"`
	PathPrefix     string    `json:"path_prefix" db:"path_prefix"`
	IsPrimary      bool      `json:"is_primary" db:"is_primary"`
	IsCustomDomain bool      `json:"is_custom_domain" db:"is_custom_domain"`
	SSLStatus      string    `json:"ssl_status" db:"ssl_status"` // NONE, PENDING, ACTIVE, FAILED
	Status         string    `json:"status" db:"status"`         // ACTIVE, INACTIVE, MAINTENANCE, PENDING_DNS
	RouteScope     string    `json:"route_scope" db:"route_scope"` // SPECIFIC_DOMAIN, ALL_MY_DOMAINS, INHERITED
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
	Version        int64     `json:"version" db:"version"`
}

// CreateTenantAppRouteRequest represents the request to create an app route
type CreateTenantAppRouteRequest struct {
	TenantID       uuid.UUID `json:"tenant_id" validate:"required,uuid"`
	AppCode        string    `json:"app_code" validate:"required,min=1,max=50"`
	Domain         string    `json:"domain" validate:"required,hostname"`
	PathPrefix     string    `json:"path_prefix,omitempty"`
	IsPrimary      bool      `json:"is_primary,omitempty"`
	IsCustomDomain bool      `json:"is_custom_domain,omitempty"`
	RouteScope     string    `json:"route_scope,omitempty" validate:"omitempty,oneof=SPECIFIC_DOMAIN ALL_MY_DOMAINS INHERITED"`
}

// UpdateTenantAppRouteRequest represents the request to update an app route
type UpdateTenantAppRouteRequest struct {
	PathPrefix     *string `json:"path_prefix,omitempty"`
	IsPrimary      *bool   `json:"is_primary,omitempty"`
	IsCustomDomain *bool   `json:"is_custom_domain,omitempty"`
	SSLStatus      *string `json:"ssl_status,omitempty" validate:"omitempty,oneof=NONE PENDING ACTIVE FAILED"`
	Status         *string `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE INACTIVE MAINTENANCE PENDING_DNS"`
	RouteScope     *string `json:"route_scope,omitempty" validate:"omitempty,oneof=SPECIFIC_DOMAIN ALL_MY_DOMAINS INHERITED"`
}

// TableName returns the table name for TenantAppRoute
func (TenantAppRoute) TableName() string {
	return "tenant_app_routes"
}
