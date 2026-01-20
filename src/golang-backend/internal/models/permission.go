package models

// PermissionCategory represents permission category
type PermissionCategory string

const (
	PermissionCategoryUsers          PermissionCategory = "USERS"
	PermissionCategoryRoles          PermissionCategory = "ROLES"
	PermissionCategoryTenants        PermissionCategory = "TENANTS"
	PermissionCategoryApplications   PermissionCategory = "APPLICATIONS"
	PermissionCategoryProducts       PermissionCategory = "PRODUCTS"
	PermissionCategoryPackages       PermissionCategory = "PACKAGES"
	PermissionCategoryOrders         PermissionCategory = "ORDERS"
	PermissionCategoryInvoices       PermissionCategory = "INVOICES"
	PermissionCategorySubscriptions  PermissionCategory = "SUBSCRIPTIONS"
	PermissionCategoryWebhooks       PermissionCategory = "WEBHOOKS"
	PermissionCategoryAnnouncements  PermissionCategory = "ANNOUNCEMENTS"
	PermissionCategorySettings       PermissionCategory = "SETTINGS"
	PermissionCategoryReports        PermissionCategory = "REPORTS"
	PermissionCategorySystem         PermissionCategory = "SYSTEM"
)

// PermissionType represents permission type/action
type PermissionType string

const (
	PermissionTypeRead   PermissionType = "READ"
	PermissionTypeWrite  PermissionType = "WRITE"
	PermissionTypeDelete PermissionType = "DELETE"
	PermissionTypeManage PermissionType = "MANAGE"
)

// Permission represents a permission in the system
type Permission struct {
	BaseModel
	Code         string             `json:"code" db:"code" validate:"required,min=3,max=100"`
	Name         string             `json:"name" db:"name" validate:"required,min=1,max=255"`
	Description  *string            `json:"description,omitempty" db:"description"`
	Category     PermissionCategory `json:"category" db:"category" validate:"required"`
	ResourceType *string            `json:"resource_type,omitempty" db:"resource_type"`
	Type         PermissionType     `json:"type" db:"type" validate:"required"`
	IsSystem     bool               `json:"is_system" db:"is_system"`
	SortOrder    int                `json:"sort_order" db:"sort_order"`
}

// CreatePermissionRequest represents request to create a permission
type CreatePermissionRequest struct {
	Code         string             `json:"code" validate:"required,min=3,max=100"`
	Name         string             `json:"name" validate:"required,min=1,max=255"`
	Description  *string            `json:"description,omitempty"`
	Category     PermissionCategory `json:"category" validate:"required"`
	ResourceType *string            `json:"resource_type,omitempty"`
	Type         PermissionType     `json:"type" validate:"required"`
	IsSystem     bool               `json:"is_system,omitempty"`
	SortOrder    int                `json:"sort_order,omitempty"`
}

// UpdatePermissionRequest represents request to update a permission
type UpdatePermissionRequest struct {
	Name         *string            `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description  *string            `json:"description,omitempty"`
	Category     *PermissionCategory `json:"category,omitempty"`
	ResourceType *string            `json:"resource_type,omitempty"`
	Type         *PermissionType    `json:"type,omitempty"`
	SortOrder    *int               `json:"sort_order,omitempty"`
}

// PermissionFilters represents filters for querying permissions
type PermissionFilters struct {
	Category     *PermissionCategory `json:"category,omitempty"`
	Type         *PermissionType     `json:"type,omitempty"`
	ResourceType *string             `json:"resource_type,omitempty"`
	IsSystem     *bool               `json:"is_system,omitempty"`
	Search       *string             `json:"search,omitempty"`
}
